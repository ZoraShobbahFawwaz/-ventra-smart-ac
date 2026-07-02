import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcIotEvent } from '../ac-events/ac-iot-event.entity';
import { EnergyLog } from './energy-log.entity';

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
    @InjectRepository(EnergyLog)
    private readonly energyLogRepo: Repository<EnergyLog>,
  ) {}

  async recordAcEvent(event: AcIotEvent) {
    if (event.power === 'ON') {
      await this.startEnergySession(event);
      return;
    }

    await this.stopEnergySession(event);
  }

  async getSummary(query: EnergyQuery) {
    const period = this.normalizePeriod(query.period);
    const range = this.getPeriodRange(period, query);
    const effectiveEnd = this.getEffectiveEnd(range.end);
    const logs = await this.findLogsInRange(range.start, effectiveEnd);
    const rooms = this.calculateRoomSummaries(logs, range.start, effectiveEnd);
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

    return this.findLogsInRange(range.start, effectiveEnd);
  }

  private async startEnergySession(event: AcIotEvent) {
    const runningSession = await this.findRunningSession(event.roomName);

    if (runningSession) {
      runningSession.temperature = event.temperature;
      runningSession.fanSpeed = event.fanSpeed;
      await this.energyLogRepo.save(runningSession);
      return;
    }

    const energyLog = this.energyLogRepo.create({
      roomName: event.roomName,
      startTime: event.eventTime,
      endTime: null,
      durationMinutes: null,
      powerWatt: this.defaultPowerWatt,
      energyKwh: null,
      startTrigger: this.getTrigger(event),
      stopTrigger: null,
      temperature: event.temperature,
      fanSpeed: event.fanSpeed,
      status: 'RUNNING',
    });

    await this.energyLogRepo.save(energyLog);
  }

  private async stopEnergySession(event: AcIotEvent) {
    const runningSession = await this.findRunningSession(event.roomName);

    if (!runningSession) {
      return;
    }

    const durationMinutes = this.calculateDurationMinutes(
      runningSession.startTime,
      event.eventTime,
    );

    runningSession.endTime = event.eventTime;
    runningSession.durationMinutes = durationMinutes;
    runningSession.energyKwh = this.calculateEnergyKwh(
      runningSession.powerWatt,
      durationMinutes,
    );
    runningSession.stopTrigger = this.getTrigger(event);
    runningSession.status = 'COMPLETED';

    await this.energyLogRepo.save(runningSession);
  }

  private async findRunningSession(roomName: string) {
    return this.energyLogRepo.findOne({
      where: {
        roomName,
        status: 'RUNNING',
      },
      order: {
        startTime: 'DESC',
        id: 'DESC',
      },
    });
  }

  private async findLogsInRange(start: Date, end: Date) {
    return this.energyLogRepo
      .createQueryBuilder('log')
      .where('log.start_time <= :end', { end })
      .andWhere('(log.end_time IS NULL OR log.end_time >= :start)', { start })
      .orderBy('log.room_name', 'ASC')
      .addOrderBy('log.start_time', 'ASC')
      .addOrderBy('log.id', 'ASC')
      .getMany();
  }

  private calculateRoomSummaries(
    logs: EnergyLog[],
    start: Date,
    end: Date,
  ): EnergyRoomSummary[] {
    const groupedLogs = logs.reduce<Record<string, EnergyLog[]>>(
      (result, log) => {
        if (!result[log.roomName]) {
          result[log.roomName] = [];
        }

        result[log.roomName].push(log);
        return result;
      },
      {},
    );

    return Object.entries(groupedLogs)
      .map(([roomName, roomLogs]) => {
        const durationMinutes = roomLogs.reduce(
          (total, log) => total + this.calculateOverlapMinutes(log, start, end),
          0,
        );

        return {
          room_name: roomName,
          total_duration_minutes: durationMinutes,
          total_energy_kwh: this.calculateEnergyKwh(
            this.defaultPowerWatt,
            durationMinutes,
          ),
          power_watt: this.defaultPowerWatt,
        };
      })
      .filter((room) => room.total_duration_minutes > 0);
  }

  private calculateOverlapMinutes(log: EnergyLog, start: Date, end: Date) {
    const sessionStart =
      log.startTime.getTime() < start.getTime() ? start : log.startTime;
    const sessionEnd = this.getEffectiveEnd(log.endTime ?? end);
    const overlapEnd =
      sessionEnd.getTime() > end.getTime() ? end : sessionEnd;

    return this.calculateDurationMinutes(sessionStart, overlapEnd);
  }

  private calculateDurationMinutes(start: Date, end: Date) {
    const durationMs = end.getTime() - start.getTime();

    return Math.max(0, Math.round(durationMs / 60000));
  }

  private calculateEnergyKwh(powerWatt: number, durationMinutes: number) {
    return this.roundEnergy((powerWatt * (durationMinutes / 60)) / 1000);
  }

  private getTrigger(event: AcIotEvent) {
    return event.eventType || event.source || 'esp32';
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
