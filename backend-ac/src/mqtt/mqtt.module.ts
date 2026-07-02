import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MqttService } from './mqtt.service';
import { MqttController } from './mqtt.controller';
import { AcIotEvent } from '../ac-events/ac-iot-event.entity';
import { EnergyModule } from '../energy/energy.module';

@Module({
  imports: [TypeOrmModule.forFeature([AcIotEvent]), EnergyModule],
  controllers: [MqttController],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}
