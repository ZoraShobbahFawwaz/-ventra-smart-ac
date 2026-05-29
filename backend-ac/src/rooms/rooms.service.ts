import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from './schedule.entity';
import { AuditService } from '../audit/audit.service';
import { Request } from 'express';
import { RoomRuntimeService } from './room-runtime.service';
import { MqttService } from '../mqtt/mqtt.service';

interface JwtUser {
  name?: string;
  email?: string;
}

type ReqUser = Request & { user?: JwtUser };

type ControlCommand = 'ON' | 'OFF';

type ControlRoomBody = {
  room_name: string;
  command: ControlCommand;
  reason: string;
};

type ActivationSource = 'manual' | 'schedule' | 'schedule-pre';

type AcCommand =
  | {
      power: 'on';
      temperature: number;
      fan: string;
    }
  | {
      power: 'off';
    };

type HttpControlPayload =
  | {
      room: string;
      power: 'on';
      temperature: number;
      fan: string;
      method: 'HTTP';
      reason: string;
    }
  | {
      room: string;
      power: 'off';
      method: 'HTTP';
      reason: string;
    };

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>,
    private readonly auditService: AuditService,
    private readonly roomRuntimeService: RoomRuntimeService,
    private readonly mqttService: MqttService,
  ) {}

  private roomStatus: Record<string, string> = {};

  updateRoomStatus(
    roomName: string,
    status: string,
    source: ActivationSource = 'schedule',
  ) {
    const normalizedStatus = status.toUpperCase();

    this.roomStatus[roomName] = normalizedStatus;

    if (normalizedStatus === 'ON') {
      if (source === 'manual') {
        this.roomRuntimeService.activateByManual(roomName);
      } else if (source === 'schedule-pre') {
        this.roomRuntimeService.activateBySchedulePre(roomName);
      } else {
        this.roomRuntimeService.activateBySchedule(roomName);
      }
    }

    if (normalizedStatus === 'OFF') {
      if (source === 'manual') {
        this.roomRuntimeService.deactivateByManual(roomName);
      } else {
        this.roomRuntimeService.deactivate(roomName);
      }
    }

    console.log(
      `STATUS UPDATE: ${roomName} -> ${normalizedStatus} | source: ${source}`,
    );
  }

  getRoomStatus(): Record<string, string> {
    return this.roomStatus;
  }

  getRoomRuntimeStatus() {
    return this.roomRuntimeService.getAllStates();
  }

  shouldSendAcCommand(roomName: string, command: AcCommand): boolean {
    return this.roomRuntimeService.shouldSendCommand(roomName, command);
  }

  recordAcCommand(roomName: string, command: AcCommand, sentBy: string) {
    this.roomRuntimeService.recordCommandSent(roomName, command, sentBy);
  }

  isManualOffOverrideActive(roomName: string): boolean {
    return this.roomRuntimeService.isManualOffOverrideActive(roomName);
  }

  clearManualOffOverride(roomName: string) {
    this.roomRuntimeService.clearManualOffOverride(roomName);
  }

  async getAllSchedules(req?: ReqUser): Promise<Schedule[]> {
    const data = await this.scheduleRepo.find();

    if (req?.user) {
      await this.auditService.createLog({
        user: req.user.email || req.user.name || 'Unknown',
        action: 'Read',
        module: 'Room',
        subject: 'Melihat semua jadwal ruangan',
      });
    }

    return data;
  }

  async createSchedule(data: Partial<Schedule>, req: ReqUser) {
    const newData = await this.scheduleRepo.save(data);

    if (req?.user) {
      await this.auditService.createLog({
        user: req.user.email || req.user.name || 'Unknown',
        action: 'Create',
        module: 'Room',
        subject: 'Menambah jadwal ruangan',
        newValue: newData,
      });
    }

    return newData;
  }

  async updateSchedule(id: number, data: Partial<Schedule>, req: ReqUser) {
    const oldData = await this.scheduleRepo.findOne({ where: { id } });

    await this.scheduleRepo.update(id, data);

    if (req?.user) {
      await this.auditService.createLog({
        user: req.user.email || req.user.name || 'Unknown',
        action: 'Update',
        module: 'Room',
        subject: 'Mengubah jadwal ruangan',
        oldValue: oldData ?? undefined,
        newValue: data,
      });
    }

    return { message: 'Updated' };
  }

  async deleteSchedule(id: number, req: ReqUser) {
    const oldData = await this.scheduleRepo.findOne({ where: { id } });

    await this.scheduleRepo.delete(id);

    if (req?.user) {
      await this.auditService.createLog({
        user: req.user.email || req.user.name || 'Unknown',
        action: 'Delete',
        module: 'Room',
        subject: 'Menghapus jadwal ruangan',
        oldValue: oldData ?? undefined,
      });
    }

    return { message: 'Deleted' };
  }

  // =========================
  // MANUAL CONTROL AC VIA HTTP
  // =========================
  async controlRoom(body: ControlRoomBody, req: ReqUser) {
    const roomName = body.room_name?.trim();
    const command = body.command;
    const reason = body.reason?.trim();

    if (!roomName) {
      return {
        message: 'room_name wajib dikirim',
        original: body,
      };
    }

    if (!command || !['ON', 'OFF'].includes(command)) {
      return {
        message: 'Command tidak valid',
        allowed_command: ['ON', 'OFF'],
        original: body,
      };
    }

    if (!reason) {
      return {
        message: 'Alasan wajib dikirim',
        original: body,
      };
    }

    let payload: HttpControlPayload;
    let acCommand: AcCommand;

    if (command === 'ON') {
      payload = {
        room: roomName,
        power: 'on',
        temperature: 24,
        fan: 'medium',
        method: 'HTTP',
        reason,
      };

      acCommand = {
        power: 'on',
        temperature: 24,
        fan: 'medium',
      };
    } else {
      payload = {
        room: roomName,
        power: 'off',
        method: 'HTTP',
        reason,
      };

      acCommand = {
        power: 'off',
      };
    }

    if (
      command === 'ON' &&
      !this.roomRuntimeService.shouldSendCommand(roomName, acCommand)
    ) {
      const runtimeState = this.roomRuntimeService.getRoomState(roomName);

      console.log(`SKIP MANUAL ON DUPLICATE: ${roomName} sudah ON 24C medium`);

      return {
        message:
          'AC sudah ON dengan suhu 24C dan fan medium, command ON yang sama tidak dikirim ulang',
        payload,
        reason,
        skipped_duplicate: true,
        runtime_state: runtimeState,
      };
    }

    try {
      console.log('KIRIM MANUAL CONTROL VIA MQTT:', payload);
      console.log('📝 ALASAN MANUAL CONTROL:', reason);

      this.mqttService.publish('ac/control', payload);

      if (command === 'ON') {
        this.updateRoomStatus(roomName, 'ON', 'manual');
      } else {
        this.updateRoomStatus(roomName, 'OFF', 'manual');
      }

      this.roomRuntimeService.recordCommandSent(roomName, acCommand, 'manual');

      const runtimeState = this.roomRuntimeService.getRoomState(roomName);

      if (req?.user) {
        await this.auditService.createLog({
          user: req.user.email || req.user.name || 'Unknown',
          action: 'Update',
          module: 'Room',
          subject:
            command === 'ON'
              ? `Menyalakan AC manual dan mengaktifkan YOLO (${roomName}). Alasan: ${reason}`
              : `Mematikan AC manual dan menonaktifkan YOLO (${roomName}). Alasan: ${reason}`,
          newValue: {
            ...payload,
            runtime_state: runtimeState,
          },
          status: 'success',
        });
      }

      return {
        message:
          command === 'ON'
            ? 'AC berhasil dinyalakan manual ke suhu 24°C dan YOLO diaktifkan'
            : 'AC berhasil dimatikan manual dan YOLO dinonaktifkan',
        payload,
        reason,
        runtime_state: runtimeState,
      };
    } catch (error: unknown) {
      let errorMessage = 'Unknown error';

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      console.error('❌ GAGAL KIRIM MANUAL CONTROL KE ESP32:', errorMessage);

      if (req?.user) {
        await this.auditService.createLog({
          user: req.user.email || req.user.name || 'Unknown',
          action: 'Update',
          module: 'Room',
          subject:
            command === 'ON'
              ? `Gagal menyalakan AC manual (${roomName}). Alasan: ${reason}`
              : `Gagal mematikan AC manual (${roomName}). Alasan: ${reason}`,
          newValue: {
            ...payload,
            error: errorMessage,
          },
          status: 'failed',
        });
      }

      return {
        message: 'Gagal mengirim perintah ke ESP32',
        payload,
        reason,
        error: errorMessage,
      };
    }
  }
}
