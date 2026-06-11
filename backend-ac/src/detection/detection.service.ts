import { Injectable } from '@nestjs/common';
import { CreateDetectionDto } from './dto/create-detection.dto';
import { RoomRuntimeService } from '../rooms/room-runtime.service';
import { MqttService } from '../mqtt/mqtt.service';

type LatestDetectionData = {
  room_name: string;
  temperature: string;
  fan_speed: string;
  occupancy: number;
  updated_at: string;
};

type LatestDetectionResponse = LatestDetectionData & {
  raw_occupancy: number;
  occupancy_samples: number;
  ac_status: string;
  yolo_enabled: boolean;
  runtime_source: string | null;
  applied_power: string;
  applied_temperature: number | null;
  applied_fan_speed: string | null;
};

@Injectable()
export class DetectionService {
  private readonly occupancyWindowSize = 10;
  private latestData: Record<string, LatestDetectionData> = {};
  private occupancyHistory: Record<string, number[]> = {};

  constructor(
    private readonly roomRuntimeService: RoomRuntimeService,
    private readonly mqttService: MqttService,
  ) {}

  async create(data: CreateDetectionDto) {
    console.log('DATA DARI YOLO:', data);

    const roomName = data.room_name?.trim();
    const temperatureRaw = String(data.temperature ?? '').trim();
    const fanSpeedRaw = String(data.fan_speed ?? '').trim();
    const temperature = temperatureRaw.toUpperCase();
    const fanSpeed = fanSpeedRaw.toUpperCase();
    const occupancy = Number(data.occupancy ?? 0);

    if (!roomName) {
      return {
        message: 'room_name wajib dikirim',
        original: data,
      };
    }

    if (!temperatureRaw) {
      return {
        message: 'temperature wajib dikirim',
        original: data,
      };
    }

    if (!fanSpeedRaw) {
      return {
        message: 'fan_speed wajib dikirim',
        original: data,
      };
    }

    if (isNaN(occupancy)) {
      return {
        message: 'occupancy tidak valid',
        original: data,
      };
    }

    this.recordOccupancy(roomName, occupancy);

    this.latestData[roomName] = {
      room_name: roomName,
      temperature: temperatureRaw,
      fan_speed: fanSpeedRaw,
      occupancy,
      updated_at: new Date().toISOString(),
    };

    const yoloAllowed = this.roomRuntimeService.isYoloEnabled(roomName);

    if (!yoloAllowed) {
      const runtimeState = this.roomRuntimeService.getRoomState(roomName);

      console.log(
        `DATA YOLO DIABAIKAN: ${roomName} belum aktif dari manual ON atau jadwal belum mulai`,
      );

      return {
        message:
          'Data YOLO diterima, tetapi tidak digunakan karena YOLO baru aktif setelah manual ON atau jadwal mulai',
        yolo_used: false,
        control_sent: false,
        runtime_state: runtimeState,
        latest: this.latestData[roomName],
        original: data,
      };
    }

    if (temperature === 'OFF' || fanSpeed === 'OFF') {
      const command = {
        power: 'off' as const,
      };
      const runtimeState = this.roomRuntimeService.getRoomState(roomName);

      if (!this.roomRuntimeService.shouldSendCommand(roomName, command)) {
        console.log(`SKIP YOLO OFF DUPLICATE: ${roomName} sudah OFF`);

        return {
          message:
            'Command OFF yang sama sudah pernah dikirim, tidak dikirim ulang ke ESP32',
          yolo_used: false,
          control_sent: false,
          skipped_duplicate: true,
          forwarded: {
            power: 'off',
          },
          runtime_state: runtimeState,
          latest: this.latestData[roomName],
          original: data,
        };
      }

      const payload = {
        room: roomName,
        power: 'off',
        source: 'yolo',
      };

      console.log('KIRIM OFF VIA MQTT:', payload);

      this.mqttService.publish('ac/control', payload);
      this.roomRuntimeService.recordCommandSent(roomName, command, 'yolo');

      return {
        message: 'Rekomendasi OFF dari YOLO berhasil dikirim via MQTT',
        yolo_used: true,
        control_sent: true,
        forwarded: {
          power: 'off',
        },
        runtime_state: this.roomRuntimeService.getRoomState(roomName),
        latest: this.latestData[roomName],
        original: data,
      };
    }

    const temp = Number(temperatureRaw);
    const fan = fanSpeedRaw.toLowerCase();

    if (isNaN(temp)) {
      return {
        message: 'temperature tidak valid',
        yolo_used: false,
        control_sent: false,
        latest: this.latestData[roomName],
        original: data,
      };
    }

    const allowedFanSpeeds = ['low', 'medium', 'high'];

    if (!allowedFanSpeeds.includes(fan)) {
      return {
        message: 'fan_speed tidak valid',
        allowed_fan_speed: allowedFanSpeeds,
        yolo_used: false,
        control_sent: false,
        latest: this.latestData[roomName],
        original: data,
      };
    }

    const command = {
      power: 'on' as const,
      temperature: temp,
      fan,
    };

    if (!this.roomRuntimeService.shouldSendCommand(roomName, command)) {
      const runtimeState = this.roomRuntimeService.getRoomState(roomName);

      console.log(
        `SKIP YOLO ON DUPLICATE: ${roomName} sudah ON ${temp}C ${fan}`,
      );

      return {
        message:
          'Command ON yang sama sudah pernah dikirim, tidak dikirim ulang ke ESP32',
        yolo_used: false,
        control_sent: false,
        skipped_duplicate: true,
        forwarded: {
          power: 'on',
          temp,
          fan,
        },
        runtime_state: runtimeState,
        latest: this.latestData[roomName],
        original: data,
      };
    }

    try {
      const payload = {
        room: roomName,
        power: 'on',
        temp,
        temperature: temp,
        fan,
        source: 'yolo',
      };

      console.log('KIRIM ON VIA MQTT:', payload);

      this.mqttService.publish('ac/control', payload);

      this.roomRuntimeService.recordCommandSent(roomName, command, 'yolo');

      const runtimeState = this.roomRuntimeService.getRoomState(roomName);

      return {
        message: 'Data YOLO berhasil digunakan dan dikirim via MQTT',
        yolo_used: true,
        control_sent: true,
        forwarded: {
          power: 'on',
          temp,
          fan,
        },
        runtime_state: runtimeState,
        latest: this.latestData[roomName],
        original: data,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('ERROR PUBLISH MQTT:', error.message);
      } else {
        console.error('ERROR PUBLISH MQTT:', error);
      }

      const runtimeState = this.roomRuntimeService.getRoomState(roomName);

      return {
        message: 'Data YOLO tersimpan, tetapi gagal publish data ke MQTT',
        yolo_used: true,
        control_sent: false,
        forwarded: {
          power: 'on',
          temp,
          fan,
        },
        runtime_state: runtimeState,
        latest: this.latestData[roomName],
        original: data,
      };
    }
  }

  getLatestData(): Record<string, LatestDetectionResponse> {
    return Object.entries(this.latestData).reduce<
      Record<string, LatestDetectionResponse>
    >((result, [roomName, data]) => {
      const appliedState = this.roomRuntimeService.getAppliedAcState(roomName);
      const occupancyAverage = this.getAverageOccupancy(roomName);

      result[roomName] = {
        ...data,
        raw_occupancy: data.occupancy,
        occupancy: occupancyAverage,
        occupancy_samples: this.occupancyHistory[roomName]?.length ?? 0,
        ...appliedState,
      };

      return result;
    }, {});
  }

  private recordOccupancy(roomName: string, occupancy: number) {
    const history = this.occupancyHistory[roomName] ?? [];

    history.push(occupancy);

    if (history.length > this.occupancyWindowSize) {
      history.shift();
    }

    this.occupancyHistory[roomName] = history;
  }

  private getAverageOccupancy(roomName: string): number {
    const history = this.occupancyHistory[roomName] ?? [];

    if (history.length === 0) {
      return 0;
    }

    const total = history.reduce((sum, value) => sum + value, 0);

    return Math.round(total / history.length);
  }
}
