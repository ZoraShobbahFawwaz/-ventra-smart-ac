import { Controller, Get, Param } from '@nestjs/common';
import { MqttService } from './mqtt.service';

@Controller('mqtt')
export class MqttController {
  constructor(private readonly mqttService: MqttService) {}

  @Get('sensor/latest')
  getLatestSensorData() {
    return this.mqttService.getLatestSensorData();
  }

  @Get('sensor/:roomName')
  getSensorByRoom(@Param('roomName') roomName: string) {
    return this.mqttService.getSensorByRoom(roomName);
  }
}