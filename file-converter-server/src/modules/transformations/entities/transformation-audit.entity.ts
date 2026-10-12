import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type TransformationAuditAction = 'history_view' | 'save' | 'download';

@Entity('transformation_audits')
export class TransformationAuditEntity {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_transformation_audits',
  })
  id: string;

  @Column({ name: 'actor_user_id', type: 'uuid' })
  actorUserId: string;

  @Column({ name: 'target_user_id', type: 'uuid', nullable: true })
  targetUserId: string | null;

  @Column({ type: 'varchar' })
  action: TransformationAuditAction;

  @Column({ name: 'transformation_id', type: 'uuid', nullable: true })
  transformationId: string | null;

  @Column({ name: 'file_id', type: 'varchar', nullable: true })
  fileId: string | null;

  @Column({ type: 'varchar' })
  result: string;

  @Column({ name: 'file_size', type: 'integer', nullable: true })
  fileSize: number | null;

  @Column({ name: 'duration_ms', type: 'integer', nullable: true })
  durationMs: number | null;

  @Column({ type: 'text', nullable: true })
  detail: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', precision: 3 })
  createdAt: Date;
}
