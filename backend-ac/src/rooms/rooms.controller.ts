import {
  Controller,
  Get,
  Req,
  UseGuards,
  Post,
  Put,
  Delete,
  Body,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

type AuthenticatedRequest = Request & {
  user?: {
    id?: number;
    username?: string;
    email?: string;
    role?: string;
    [key: string]: any;
  };
};

type ControlRoomBody = {
  room_name?: string;
  command?: 'ON' | 'OFF';
  reason?: string;
};

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  // =========================
  // STATUS ROOM
  // =========================
  @UseGuards(AuthGuard('jwt'))
  @Get('status')
  async getRoomStatus() {
    const schedules = await this.roomsService.getAllSchedules();

    const now = new Date();

    const hari = now
      .toLocaleString('en-US', { weekday: 'long' })
      .trim()
      .toLowerCase();

    const currentTime = now.toTimeString().slice(0, 5);

    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const nowMin = toMinutes(currentTime);

    const result: Record<string, string> = {};

    const isTimeInRange = (current: number, start: number, end: number) => {
      // Jadwal normal, contoh 08:00 - 10:00
      if (start <= end) {
        return current >= start && current <= end;
      }

      // Jadwal lewat tengah malam, contoh 22:00 - 02:00
      return current >= start || current <= end;
    };

    schedules.forEach((row) => {
      if (!row?.room_name || !row?.day || !row?.start_time || !row?.end_time) {
        return;
      }

      if (!result[row.room_name]) {
        result[row.room_name] = 'OFF';
      }

      const rowDay = row.day.trim().toLowerCase();

      if (rowDay !== hari) {
        return;
      }

      const startMin = toMinutes(row.start_time.slice(0, 5));
      const endMin = toMinutes(row.end_time.slice(0, 5));

      // PRE ON 10 menit sebelum jam mulai
      let preMin = startMin - 10;

      if (preMin < 0) {
        preMin += 24 * 60;
      }

      // Ruangan dianggap ON sejak PRE sampai end_time
      if (isTimeInRange(nowMin, preMin, endMin)) {
        result[row.room_name] = 'ON';
      }
    });

    // Gabungkan status manual/scheduler dari memory RoomsService
    const manualStatus = this.roomsService.getRoomStatus();

    Object.keys(manualStatus).forEach((roomName) => {
      result[roomName] = manualStatus[roomName];
    });

    const runtimeStatus = this.roomsService.getRoomRuntimeStatus();

    Object.entries(runtimeStatus).forEach(([roomName, state]) => {
      result[roomName] = state.ac_status;
    });

    return result;
  }

  // =========================
  // CONTROL ROOM MANUAL
  // =========================
  @UseGuards(AuthGuard('jwt'))
  @Post('control')
  controlRoom(
    @Body() body: ControlRoomBody,
    @Req() req: AuthenticatedRequest,
  ) {
    const roomName = body.room_name?.trim();
    const command = body.command;
    const reason = body.reason?.trim();

    if (!roomName) {
      throw new BadRequestException('room_name wajib dikirim');
    }

    if (!command || !['ON', 'OFF'].includes(command)) {
      throw new BadRequestException('command wajib diisi dengan ON atau OFF');
    }

    if (!reason) {
      throw new BadRequestException('reason/alasan wajib dikirim');
    }

    return this.roomsService.controlRoom(
      {
        room_name: roomName,
        command,
        reason,
      },
      req,
    );
  }

  // =========================
  // GET ALL SCHEDULES
  // =========================
  @UseGuards(AuthGuard('jwt'))
  @Get()
  getAllSchedules(@Req() req: AuthenticatedRequest) {
    return this.roomsService.getAllSchedules(req);
  }

  // =========================
  // CREATE
  // =========================
  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() body: any, @Req() req: AuthenticatedRequest) {
    return this.roomsService.createSchedule(body, req);
  }

  // =========================
  // UPDATE
  // =========================
  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: AuthenticatedRequest,
  ) {
    const scheduleId = Number(id);

    if (isNaN(scheduleId)) {
      throw new BadRequestException('id jadwal tidak valid');
    }

    return this.roomsService.updateSchedule(scheduleId, body, req);
  }

  // =========================
  // DELETE
  // =========================
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const scheduleId = Number(id);

    if (isNaN(scheduleId)) {
      throw new BadRequestException('id jadwal tidak valid');
    }

    return this.roomsService.deleteSchedule(scheduleId, req);
  }
}
