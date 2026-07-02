import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcIotEvent } from '../ac-events/ac-iot-event.entity';
import { EnergyController } from './energy.controller';
import { EnergyService } from './energy.service';

@Module({
  imports: [TypeOrmModule.forFeature([AcIotEvent])],
  controllers: [EnergyController],
  providers: [EnergyService],
})
export class EnergyModule {}
