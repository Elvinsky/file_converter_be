import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { PermissionEntity } from './permission.entity';
import { RoleEntity } from './role.entity';

@Entity('rbac_grants')
@Unique('UQ_rbac_grants_role_id_permission_id', ['roleId', 'permissionId'])
export class GrantEntity {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_rbac_grants' })
  id: string;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId: string;

  @ManyToOne(() => RoleEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({
    name: 'role_id',
    foreignKeyConstraintName: 'FK_rbac_grants_role_id',
  })
  role: RoleEntity;

  @Column({ name: 'permission_id', type: 'uuid' })
  permissionId: string;

  @ManyToOne(() => PermissionEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({
    name: 'permission_id',
    foreignKeyConstraintName: 'FK_rbac_grants_permission_id',
  })
  permission: PermissionEntity;

  @Column({ type: 'text', array: true, nullable: true })
  actions: string[] | null;

  @CreateDateColumn({ name: 'created_at', select: false })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', select: false })
  updatedAt: Date;
}
