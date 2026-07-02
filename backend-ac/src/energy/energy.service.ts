import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, Repository } from 'typeorm';
import { AcIotEvent } from '../ac-events/ac-iot-event.entity';

type EnergyPeriod = 'day' | 'week' | 'month';

type EnergyQuery = {
  period?: string;
  date?: string;
  year?: string;
  month?: string;
  week?: string;
};

type EnergyRoomSummary = {
  room_name: string;
  total_duration_minutes: number;
  total_energy_kwh: number;
  power_watt: number;
};

@Injectable()
export class EnergyService {
  private readonly defaultPowerWatt = Number(process.env.AC_POWER_WATT || 330);

  constructor(
    @InjectRepository(AcIotEvent)
    private readonly acIotEventRepo: Repository<AcIotEvent>,
  ) {}

  async getSummary(query: EnergyQuery) {
    const period = this.normalizePeriod(query.period);
    const range = this.getPeriodRange(period, query);
    const effectiveEnd = this.getEffectiveEnd(range.end);
    const events = await this.acIotEventRepo.find({
      where: {
        eventTime: LessThanOrEqual(effectiveEnd),
      },
      order: {
        roomName: 'ASC',
        eventTime: 'ASC',
        id: 'ASC',
      },
    });

    const rooms = this.calculateRoomSummaries(
      events,
      range.start,
      effectiveEnd,
    );
    const totalEnergy = this.roundEnergy(
      rooms.reduce((total, room) => total + room.total_energy_kwh, 0),
    );
    const totalDurationMinutes = rooms.reduce(
      (total, room) => total + room.total_duration_minutes,
      0,
    );

    return {
      period,
      start_time: range.start.toISOString(),
      end_time: effectiveEnd.toISOString(),
      power_watt: this.defaultPowerWatt,
      total_duration_minutes: totalDurationMinutes,
      total_energy_kwh: totalEnergy,
      average_energy_kwh:
        rooms.length > 0 ? this.roundEnergy(totalEnergy / rooms.length) : 0,
      rooms,
    };
  }

  async getEvents(query: EnergyQuery) {
    const period = this.normalizePeriod(query.period);
    const range = this.getPeriodRange(period, query);
    const effectiveEnd = this.getEffectiveEnd(range.end);

    return this.acIotEventRepo.find({
      where: {
        eventTime: Between(range.start, effectiveEnd),
      },
      order: {
        roomName: 'ASC',
        eventTime: 'ASC',
        id: 'ASC',
      },
    });
  }

  private calculateRoomSummaries(
    events: AcIotEvent[],
    start: Date,
    end: Date,
  ): EnergyRoomSummary[] {
    const groupedEvents = events.reduce<Record<string, AcIotEvent[]>>(
      (result, event) => {
        if (!result[event.roomName]) {
          result[event.roomName] = [];
        }

        result[event.roomName].push(event);
        return result;
      },
      {},
    );

    return Object.entries(groupedEvents)
      .map(([roomName, roomEvents]) => {
        const durationMinutes = this.calculateOnDurationMinutes(
          roomEvents,
          start,
          end,
        );

        return {
          room_name: roomName,
          total_duration_minutes: durationMinutes,
          total_energy_kwh: this.roundEnergy(
            (this.defaultPowerWatt * (durationMinutes / 60)) / 1000,
          ),
          power_watt: this.defaultPowerWatt,
        };
      })
      .filter((room) => room.total_duration_minutes > 0);
  }

  private calculateOnDurationMinutes(
    events: AcIotEvent[],
    start: Date,
    end: Date,
  ) {
    let currentPower: 'ON' | 'OFF' = 'OFF';
    let activeStart: Date | null = null;
    let durationMs = 0;

    for (const event of events) {
      const eventTime = new Date(event.eventTime);

      if (eventTime < start) {
        currentPower = event.power;
        activeStart = currentPower === 'ON' ? start : null;
        continue;
      }

      if (eventTime > end) {
        break;
      }

      if (event.power === 'ON') {
        if (currentPower !== 'ON') {
          activeStart = eventTime < start ? start : eventTime;
        }

        currentPower = 'ON';
        continue;
      }

      if (event.power === 'OFF') {
        if (currentPower === 'ON' && activeStart) {
          durationMs += eventTime.getTime() - activeStart.getTime();
        }

        currentPower = 'OFF';
        activeStart = null;
      }
    }

    if (currentPower === 'ON' && activeStart) {
      durationMs += end.getTime() - activeStart.getTime();
    }

    return Math.max(0, Math.round(durationMs / 60000));
  }

  private getPeriodRange(period: EnergyPeriod, query: EnergyQuery) {
    if (period === 'day') {
      const date = this.parseDate(query.date);
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setHours(23, 59, 59, 999);

      return { start, end };
    }

    const year = Number(query.year || new Date().getFullYear());
    const month = Number(query.month || new Date().getMonth() + 1);
    const normalizedMonth = Math.min(Math.max(month, 1), 12);

    if (period === 'week') {
      const week = Math.min(Math.max(Number(query.week || 1), 1), 4);
      const startDay = (week - 1) * 7 + 1;
      const endDay =
        week === 4 ? new Date(year, normalizedMonth, 0).getDate() : week * 7;
      const start = new Date(year, normalizedMonth - 1, startDay, 0, 0, 0, 0);
      const end = new Date(year, normalizedMonth - 1, endDay, 23, 59, 59, 999);

      return { start, end };
    }

    const start = new Date(year, normalizedMonth - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, normalizedMonth, 0, 23, 59, 59, 999);

    return { start, end };
  }

  private normalizePeriod(period: string | undefined): EnergyPeriod {
    if (period === 'day' || period === 'week' || period === 'month') {
      return period;
    }

    return 'month';
  }

  private parseDate(value: string | undefined) {
    if (!value) {
      return new Date();
    }

    const date = new Date(`${value}T00:00:00`);

    return isNaN(date.getTime()) ? new Date() : date;
  }

  private roundEnergy(value: number) {
    return Number(value.toFixed(3));
  }

  private getEffectiveEnd(end: Date) {
    const now = new Date();

    return end.getTime() > now.getTime() ? now : end;
  }
}
