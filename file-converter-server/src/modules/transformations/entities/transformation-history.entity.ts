import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { UserEntity } from '@/modules/users/entities/users.entity';

export type TransformationType = 'file' | 'image';
export type TransformationStatus = 'success' | 'error';

@Entity('transformation_history')
@Index('IDX_transformation_history_user_id', ['userId'])
@Index('IDX_transformation_history_created_at', ['createdAt'])
@Index('IDX_transformation_history_type', ['type'])
@Index('IDX_transformation_history_status', ['status'])
export class TransformationHistoryEntity {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_transformation_history',
  })
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'FK_transformation_history_user_id',
  })
  user: UserEntity;

  @Column({ type: 'varchar' })
  type: TransformationType;

  @Column({ name: 'source_format', type: 'varchar' })
  sourceFormat: string;

  @Column({ name: 'target_format', type: 'varchar' })
  targetFormat: string;

  @Column({ type: 'varchar' })
  status: TransformationStatus;

  @Column({ name: 'file_size', type: 'integer' })
  fileSize: number;

  @Column({ name: 'duration_ms', type: 'integer' })
  durationMs: number;

  @Column({ name: 'error_code', type: 'varchar', nullable: true })
  errorCode: string | null;

  @Column({ name: 'storage_key', type: 'varchar', nullable: true })
  storageKey: string | null;

  @Column({ name: 'result_file_name', type: 'varchar', nullable: true })
  resultFileName: string | null;

  @Column({ name: 'content_type', type: 'varchar', nullable: true })
  contentType: string | null;

  @Column({ name: 'expires_at', type: 'timestamp', precision: 3 })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', precision: 3 })
  createdAt: Date;
}
