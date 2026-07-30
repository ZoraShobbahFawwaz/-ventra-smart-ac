import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MqttService } from './mqtt.service';
import { MqttController } from './mqtt.controller';
import { AcIotEvent } from '../ac-events/ac-iot-event.entity';
import { AuditModule } from '../audit/audit.module';
import { EnergyModule } from '../energy/energy.module';

@Module({
  imports: [TypeOrmModule.forFeature([AcIotEvent]), AuditModule, EnergyModule],
  controllers: [MqttController],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}
