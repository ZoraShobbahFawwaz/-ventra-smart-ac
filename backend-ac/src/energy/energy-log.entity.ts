import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('energy_logs')
export class EnergyLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'room_name' })
  roomName!: string;

  @Column({ name: 'start_time', type: 'datetime' })
  startTime!: Date;

  @Column({ name: 'end_time', type: 'datetime', nullable: true })
  endTime!: Date | null;

  @Column({ name: 'duration_minutes', type: 'int', nullable: true })
  durationMinutes!: number | null;

  @Column({ name: 'power_watt', type: 'int', default: 330 })
  powerWatt!: number;

  @Column({ name: 'energy_kwh', type: 'decimal', precision: 10, scale: 3, nullable: true })
  energyKwh!: number | null;

  @Column({ name: 'start_trigger', type: 'varchar', length: 50, nullable: true })
  startTrigger!: string | null;

  @Column({ name: 'stop_trigger', type: 'varchar', length: 50, nullable: true })
  stopTrigger!: string | null;

  @Column({ type: 'int', nullable: true })
  temperature!: number | null;

  @Column({ name: 'fan_speed', type: 'varchar', length: 20, nullable: true })
  fanSpeed!: string | null;

  @Column({
    type: 'enum',
    enum: ['RUNNING', 'COMPLETED'],
    default: 'RUNNING',
  })
  status!: 'RUNNING' | 'COMPLETED';

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
