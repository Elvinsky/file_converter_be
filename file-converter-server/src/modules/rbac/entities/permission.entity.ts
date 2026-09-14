import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('rbac_permissions')
@Unique('UQ_rbac_permissions_name', ['name'])
export class PermissionEntity {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_rbac_permissions',
  })
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', array: true })
  actions: string[];

  @CreateDateColumn({ name: 'created_at', select: false })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', select: false })
  updatedAt: Date;
}
