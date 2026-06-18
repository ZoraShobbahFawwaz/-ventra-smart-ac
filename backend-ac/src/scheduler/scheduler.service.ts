import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RoomsService } from '../rooms/rooms.service';
import { MqttService } from '../mqtt/mqtt.service';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private executedEvents = new Set<string>();

  constructor(
    private readonly roomsService: RoomsService,
    private readonly mqttService: MqttService,
  ) {}

  onModuleInit() {
    console.log('Scheduler Loaded');

    setTimeout(() => {
      void this.handleCron();
    }, 5000);
  }

  @Cron('* * * * *')
  async handleCron(): Promise<void> {
    console.log('Cek jadwal...');

    const now = new Date();
    const hari = now
      .toLocaleString('en-US', {
        weekday: 'long',
      })
      .trim()
      .toLowerCase();
    const jam = now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    try {
      const schedules = await this.roomsService.getAllSchedules();
      const activeScheduleRooms = new Set<string>();

      for (const row of schedules) {
        if (
          !row?.room_name ||
          !row?.day ||
          !row?.start_time ||
          !row?.end_time
        ) {
          continue;
        }

        const rowDay = row.day.trim().toLowerCase();

        if (rowDay !== hari) {
          continue;
        }

        const roomName = row.room_name.trim();
        const start = row.start_time.slice(0, 5);
        const end = row.end_time.slice(0, 5);
        const pre = this.getPreTime(start);
        const yoloStart = this.addMinutes(start, 30);

        const keyPre = `${row.id}-${roomName}-${pre}-PRE`;
        const keyStart = `${row.id}-${roomName}-${start}-START`;
        const keyYoloStart = `${row.id}-${roomName}-${yoloStart}-YOLO`;
        const keyEnd = `${row.id}-${roomName}-${end}-OFF`;

        const nowMin = this.toMinutes(jam);
        const preMin = this.toMinutes(pre);
        const startMin = this.toMinutes(start);
        const yoloStartMin = this.toMinutes(yoloStart);
        const endMin = this.toMinutes(end);
        const isPreTime = jam === pre;
        const isStartTime = jam === start;
        const isYoloStartTime = jam === yoloStart;
        const isEndTime = jam === end;
        const isPreWindow = this.isTimeInRangeBeforeEnd(
          nowMin,
          preMin,
          startMin,
        );
        const isActiveSchedule = this.isTimeInRangeBeforeEnd(
          nowMin,
          startMin,
          endMin,
        );
        const isYoloActiveWindow =
          this.isTimeInRangeBeforeEnd(nowMin, yoloStartMin, endMin) &&
          yoloStartMin !== endMin;
        const manualOffOverrideActive = this.isManualOffOverrideActive(
          roomName,
          preMin,
          endMin,
          now,
        );

        if (isPreWindow || isActiveSchedule) {
          activeScheduleRooms.add(roomName);
        }

        if (manualOffOverrideActive && (isPreWindow || isActiveSchedule)) {
          console.log(
            `MANUAL OFF OVERRIDE: ${roomName} skip scheduler ON sampai jadwal selesai`,
          );
        }

        if (
          isPreTime &&
          !manualOffOverrideActive &&
          !this.executedEvents.has(keyPre)
        ) {
          console.log(`PRE ON: ${roomName} (24C)`);

          this.sendSchedulePreOn(roomName, 'scheduler-pre');
          this.executedEvents.add(keyPre);
        }

        if (
          isPreWindow &&
          !manualOffOverrideActive &&
          !isPreTime &&
          !isStartTime
        ) {
          const runtimeStates = this.roomsService.getRoomRuntimeStatus();
          const runtimeState = runtimeStates[roomName];

          if (!runtimeState || runtimeState.ac_status !== 'ON') {
            console.log(
              `SYNC PRE SCHEDULE: ${roomName} pre-on aktif, AC ON 24C tanpa YOLO`,
            );

            this.sendSchedulePreOn(roomName, 'scheduler-pre-sync');
          }
        }

        if (
          isStartTime &&
          !manualOffOverrideActive &&
          !this.executedEvents.has(keyStart)
        ) {
          console.log(
            `START SCHEDULE: ${roomName} AC tetap ON 24C, YOLO menunggu sampai ${yoloStart}`,
          );

          this.sendSchedulePreOn(roomName, 'scheduler-start-wait-yolo');
          this.executedEvents.add(keyStart);
        }

        if (
          isYoloStartTime &&
          !manualOffOverrideActive &&
          !isEndTime &&
          !this.executedEvents.has(keyYoloStart)
        ) {
          console.log(`YOLO ENABLED: ${roomName} setelah toleransi 30 menit`);

          this.sendScheduleActiveOn(roomName, 'scheduler-yolo-start');
          this.executedEvents.add(keyYoloStart);
        }

        if (
          isYoloActiveWindow &&
          !manualOffOverrideActive &&
          !isYoloStartTime &&
          !isEndTime
        ) {
          const runtimeStates = this.roomsService.getRoomRuntimeStatus();
          const runtimeState = runtimeStates[roomName];

          if (!runtimeState?.yolo_enabled) {
            console.log(
              `SYNC YOLO ACTIVE: ${roomName} masa toleransi selesai, YOLO diaktifkan`,
            );

            this.sendScheduleActiveOn(roomName, 'scheduler-yolo-sync');
          }
        }

        if (isEndTime && !this.executedEvents.has(keyEnd)) {
          console.log(`OFF: ${roomName}`);
          this.roomsService.clearManualOffOverride(roomName);

          const payload = {
            room: roomName,
            power: 'off',
            source: 'scheduler',
          };

          this.mqttService.publish('ac/control', payload);
          this.roomsService.updateRoomStatus(roomName, 'OFF', 'schedule');
          this.roomsService.recordAcCommand(
            roomName,
            {
              power: 'off',
            },
            'scheduler',
          );

          this.executedEvents.add(keyEnd);
        }
      }

      this.turnOffRoomsOutsideSchedule(activeScheduleRooms);

      if (jam === '00:00' && this.executedEvents.size > 0) {
        this.executedEvents.clear();
        console.log('Reset event harian');
      }
    } catch (error) {
      if (error instanceof Error) {
        console.log('Error scheduler:', error.message);
      } else {
        console.log('Error scheduler:', error);
      }
    }
  }

  private sendSchedulePreOn(roomName: string, source: string) {
    const command = {
      power: 'on' as const,
      temperature: 24,
      fan: 'low',
    };

    const runtimeStates = this.roomsService.getRoomRuntimeStatus();
    const runtimeState = runtimeStates[roomName];
    const preserveManualYolo =
      runtimeState?.source === 'manual' && runtimeState.yolo_enabled === true;

    if (!this.roomsService.shouldSendAcCommand(roomName, command)) {
      console.log(`SKIP DUPLICATE ON: ${roomName} sudah ON 24C low`);

      if (!preserveManualYolo) {
        this.roomsService.updateRoomStatus(roomName, 'ON', 'schedule-pre');
      }

      return;
    }

    const payload = {
      room: roomName,
      power: 'on',
      temp: 24,
      temperature: 24,
      fan: 'low',
      source,
    };

    this.mqttService.publish('ac/control', payload);

    if (!preserveManualYolo) {
      this.roomsService.updateRoomStatus(roomName, 'ON', 'schedule-pre');
    }

    this.roomsService.recordAcCommand(roomName, command, source);
  }

  private sendScheduleActiveOn(roomName: string, source: string) {
    const command = {
      power: 'on' as const,
      temperature: 24,
      fan: 'low',
    };

    if (!this.roomsService.shouldSendAcCommand(roomName, command)) {
      console.log(`SKIP DUPLICATE ON: ${roomName} sudah ON 24C low`);
      this.roomsService.updateRoomStatus(roomName, 'ON', 'schedule');
      return;
    }

    const payload = {
      room: roomName,
      power: 'on',
      temp: 24,
      temperature: 24,
      fan: 'low',
      source,
    };

    this.mqttService.publish('ac/control', payload);
    this.roomsService.updateRoomStatus(roomName, 'ON', 'schedule');
    this.roomsService.recordAcCommand(roomName, command, source);
  }

  private turnOffRoomsOutsideSchedule(activeScheduleRooms: Set<string>) {
    const runtimeStates = this.roomsService.getRoomRuntimeStatus();

    Object.entries(runtimeStates).forEach(([roomName, runtimeState]) => {
      const controlledBySchedule =
        runtimeState.source === 'schedule' ||
        runtimeState.source === 'schedule-pre';

      if (
        !controlledBySchedule ||
        runtimeState.ac_status !== 'ON' ||
        activeScheduleRooms.has(roomName)
      ) {
        return;
      }

      console.log(
        `SCHEDULE CHANGED/INACTIVE: ${roomName} tidak lagi dalam rentang jadwal, kirim OFF`,
      );

      const command = {
        power: 'off' as const,
      };
      const payload = {
        room: roomName,
        power: 'off',
        source: 'scheduler-sync',
      };

      this.mqttService.publish('ac/control', payload);
      this.roomsService.updateRoomStatus(roomName, 'OFF', 'schedule');
      this.roomsService.recordAcCommand(
        roomName,
        command,
        'scheduler-sync',
      );
    });
  }

  private isManualOffOverrideActive(
    roomName: string,
    windowStartMin: number,
    windowEndMin: number,
    now: Date,
  ): boolean {
    const runtimeStates = this.roomsService.getRoomRuntimeStatus();
    const runtimeState = runtimeStates[roomName];
    const manualOverride = runtimeState?.manual_off_override;

    if (!manualOverride?.active) {
      return false;
    }

    const overrideDate = new Date(manualOverride.updated_at);

    if (
      isNaN(overrideDate.getTime()) ||
      overrideDate.toDateString() !== now.toDateString()
    ) {
      this.roomsService.clearManualOffOverride(roomName);
      return false;
    }

    const overrideMin =
      overrideDate.getHours() * 60 + overrideDate.getMinutes();

    if (
      !this.isTimeInRangeBeforeEnd(overrideMin, windowStartMin, windowEndMin)
    ) {
      this.roomsService.clearManualOffOverride(roomName);
      return false;
    }

    return true;
  }

  private getPreTime(time: string): string {
    return this.addMinutes(time, -10);
  }

  private addMinutes(time: string, minutesToAdd: number): string {
    let [h, m] = time.split(':').map(Number);

    m += minutesToAdd;

    if (m < 0) {
      const hoursToSubtract = Math.ceil(Math.abs(m) / 60);
      m += hoursToSubtract * 60;
      h -= hoursToSubtract;
    }

    if (m >= 60) {
      h += Math.floor(m / 60);
      m %= 60;
    }

    h = ((h % 24) + 24) % 24;

    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private isTimeInRangeBeforeEnd(
    current: number,
    start: number,
    end: number,
  ): boolean {
    if (start <= end) {
      return current >= start && current < end;
    }

    return current >= start || current < end;
  }
}
