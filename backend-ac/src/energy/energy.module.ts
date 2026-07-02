import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnergyController } from './energy.controller';
import { EnergyLog } from './energy-log.entity';
import { EnergyService } from './energy.service';

@Module({
  imports: [TypeOrmModule.forFeature([EnergyLog])],
  controllers: [EnergyController],
  providers: [EnergyService],
  exports: [EnergyService],
})
export class EnergyModule {}
