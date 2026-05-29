import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  room_name!: string;

  @Column()
  day!: string;

  @Column()
  start_time!: string;

  @Column()
  end_time!: string;
}
