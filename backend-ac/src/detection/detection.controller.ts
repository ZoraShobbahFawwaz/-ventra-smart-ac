import { Controller, Post, Body, Get } from '@nestjs/common';
import { DetectionService } from './detection.service';
import { CreateDetectionDto } from './dto/create-detection.dto';

@Controller('detection')
export class DetectionController {
  constructor(private readonly detectionService: DetectionService) {}

  @Post()
  create(@Body() data: CreateDetectionDto) {
    return this.detectionService.create(data);
  }

  @Get('latest')
  getLatestData() {
    return this.detectionService.getLatestData();
  }
}