import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_name', type: 'varchar', length: 100, nullable: true })
  userName!: string | null;

  @Column()
  action!: string;

  @Column()
  module!: string;

  @Column({ type: 'text' })
  subject!: string;

  @Column({ name: 'old_value', type: 'longtext', nullable: true })
  oldValue!: string | null;

  @Column({ name: 'new_value', type: 'longtext', nullable: true })
  newValue!: string | null;

  @Column({ default: 'success' })
  status!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
