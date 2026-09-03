import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('otp')
export class OtpEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  email: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId: string;

  @Column({ name: 'otp_hash', type: 'varchar', nullable: false, select: false })
  otpHash: string;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: false })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at', select: false })
  createdAt: Date;

  @Column({ type: 'int', nullable: false, default: 0 })
  attempts: number;
}
