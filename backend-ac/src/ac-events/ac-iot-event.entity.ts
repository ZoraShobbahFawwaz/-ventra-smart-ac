import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('ac_iot_events')
export class AcIotEvent {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'room_name' })
  roomName!: string;

  @Column({ name: 'event_time', type: 'datetime' })
  eventTime!: Date;

  @Column({ name: 'event_type', type: 'varchar', length: 50, nullable: true })
  eventType!: string | null;

  @Column({ type: 'enum', enum: ['ON', 'OFF'] })
  power!: 'ON' | 'OFF';

  @Column({ type: 'int', nullable: true })
  temperature!: number | null;

  @Column({ name: 'actual_temperature', type: 'float', nullable: true })
  actualTemperature!: number | null;

  @Column({ type: 'float', nullable: true })
  humidity!: number | null;

  @Column({
    name: 'fan_speed',
    type: 'enum',
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    nullable: true,
  })
  fanSpeed!: 'LOW' | 'MEDIUM' | 'HIGH' | null;

  @Column({ type: 'varchar', length: 50 })
  source!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
