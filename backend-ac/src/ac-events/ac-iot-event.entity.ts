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

  @Column({ type: 'enum', enum: ['ON', 'OFF'] })
  power!: 'ON' | 'OFF';

  @Column({ type: 'int', nullable: true })
  temperature!: number | null;

  @Column({
    name: 'fan_speed',
    type: 'enum',
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    nullable: true,
  })
  fanSpeed!: 'LOW' | 'MEDIUM' | 'HIGH' | null;

  @Column({
    type: 'enum',
    enum: ['scheduler', 'yolo', 'manual', 'esp32'],
  })
  source!: 'scheduler' | 'yolo' | 'manual' | 'esp32';

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
