import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { Schedule } from './schedule.entity';
import { AuditModule } from '../audit/audit.module';
import { MqttModule } from '../mqtt/mqtt.module';
import { RoomRuntimeService } from './room-runtime.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Schedule]),
    AuditModule,
    forwardRef(() => MqttModule),
  ],
  controllers: [RoomsController],
  providers: [RoomsService, RoomRuntimeService],
  exports: [RoomsService, RoomRuntimeService],
})
export class RoomsModule {}
