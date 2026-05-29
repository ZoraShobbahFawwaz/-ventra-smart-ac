import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AppService } from './app.service';
import { MqttService } from './mqtt/mqtt.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

interface YoloDetectionDto {
  room_id?: string;
  people_count?: number;
  recommendation?: {
    temperature?: number;
    fan_speed?: number;
    mode?: string;
  };
}

interface YoloDetectionResponse {
  status: string;
  message: string;
  topic: string;
  command: Record<string, any>;
}

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly mqttService: MqttService,
  ) {
    console.log('✅ AppController ACTIVE (file terbaru kepakai)');
  }

  @Get('/')
  getHello(): string {
    return this.appService.getHello();
  }

  // endpoint yang dilindungi JWT
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(): { message: string } {
    return {
      message: 'Anda berhasil mengakses endpoint yang dilindungi',
    };
  }

  // endpoint control AC (hanya admin)
  @Post('/yolo/detection')
  @UseGuards(JwtAuthGuard, new RolesGuard('admin'))
  @HttpCode(200)
  yoloDetection(@Body() body: YoloDetectionDto): YoloDetectionResponse {
    console.log('[YOLO] Data masuk:', body);

    const roomId = body.room_id ?? 'R101';
    const acId = 'AC-01';
    const topic = `ac/${roomId}/${acId}/set`;

    const command = {
      room_id: roomId,
      ac_id: acId,
      command: 'SET_AC',
      payload: {
        temperature: body.recommendation?.temperature ?? 24,
        fan_speed: body.recommendation?.fan_speed ?? 2,
        mode: body.recommendation?.mode ?? 'cool',
      },
      timestamp: new Date().toISOString(),
    };

    console.log('[MQTT] Publish ke topic:', topic);
    console.log('[MQTT] Payload:', command);

    this.mqttService.publish(topic, command);

    return {
      status: 'ok',
      message: 'YOLO detection received and command published to MQTT',
      topic,
      command,
    };
  }
}
