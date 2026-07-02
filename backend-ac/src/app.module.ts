import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { MqttModule } from './mqtt/mqtt.module';
import { AuthModule } from './auth/auth.module';
import { RoomsModule } from './rooms/rooms.module';
import { AuditModule } from './audit/audit.module';
import { DetectionModule } from './detection/detection.module';
import { UsersModule } from './users/users.module';
import { EnergyModule } from './energy/energy.module';

import { User } from './users/user.entity';
import { Schedule } from './rooms/schedule.entity';
import { AcIotEvent } from './ac-events/ac-iot-event.entity';
import { AuditLog } from './audit/audit.entity';
import { EnergyLog } from './energy/energy-log.entity';

import { SchedulerService } from './scheduler/scheduler.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST || process.env.MYSQLHOST || 'localhost',
      port: Number(process.env.DATABASE_PORT || process.env.MYSQLPORT || 3306),
      username: process.env.DATABASE_USER || process.env.MYSQLUSER || 'root',
      password: process.env.DATABASE_PASSWORD || process.env.MYSQLPASSWORD || '',
      database: process.env.DATABASE_NAME || process.env.MYSQLDATABASE || 'ac',
      ssl:
        process.env.DATABASE_SSL === 'true'
          ? {
              rejectUnauthorized: false,
            }
          : undefined,
      entities: [User, Schedule, AcIotEvent, AuditLog, EnergyLog],
      synchronize: false,
    }),

    ScheduleModule.forRoot(),

    MqttModule,
    AuthModule,
    UsersModule,
    RoomsModule,
    AuditModule,
    DetectionModule,
    EnergyModule,
  ],
  controllers: [AppController],
  providers: [AppService, SchedulerService],
})
export class AppModule {}
