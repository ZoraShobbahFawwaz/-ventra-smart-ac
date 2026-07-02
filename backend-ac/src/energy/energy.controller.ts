import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EnergyService } from './energy.service';

@Controller('energy')
export class EnergyController {
  constructor(private readonly energyService: EnergyService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('summary')
  getSummary(@Query() query: Record<string, string>) {
    return this.energyService.getSummary(query);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('events')
  getEvents(@Query() query: Record<string, string>) {
    return this.energyService.getEvents(query);
  }
}
