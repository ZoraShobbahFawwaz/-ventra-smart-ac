import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  getLogs() {
    return this.auditService.getAllLogs();
  }
}
