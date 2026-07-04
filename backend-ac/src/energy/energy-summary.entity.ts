import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('energy_summaries')
export class EnergySummary {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'room_name' })
  roomName!: string;

  @Column({
    name: 'period_type',
    type: 'enum',
    enum: ['DAY', 'WEEK', 'MONTH'],
  })
  periodType!: 'DAY' | 'WEEK' | 'MONTH';

  @Column({ name: 'period_start', type: 'datetime' })
  periodStart!: Date;

  @Column({ name: 'period_end', type: 'datetime' })
  periodEnd!: Date;

  @Column({ name: 'total_duration_minutes', type: 'int', default: 0 })
  totalDurationMinutes!: number;

  @Column({
    name: 'total_energy_kwh',
    type: 'decimal',
    precision: 10,
    scale: 3,
    default: 0,
  })
  totalEnergyKwh!: number;

  @Column({ name: 'powerwatt', type: 'int', default: 3330 })
  powerWatt!: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
