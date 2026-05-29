import { Module } from '@nestjs/common';
import { DetectionController } from './detection.controller';
import { DetectionService } from './detection.service';
import { RoomsModule } from '../rooms/rooms.module';
import { MqttModule } from '../mqtt/mqtt.module';

@Module({
  imports: [RoomsModule, MqttModule],
  controllers: [DetectionController],
  providers: [DetectionService],
})
export class DetectionModule {}
