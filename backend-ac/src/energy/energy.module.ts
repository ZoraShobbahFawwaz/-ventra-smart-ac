import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnergyController } from './energy.controller';
import { EnergyLog } from './energy-log.entity';
import { EnergySummary } from './energy-summary.entity';
import { EnergyService } from './energy.service';

@Module({
  imports: [TypeOrmModule.forFeature([EnergyLog, EnergySummary])],
  controllers: [EnergyController],
  providers: [EnergyService],
  exports: [EnergyService],
})
export class EnergyModule {}
