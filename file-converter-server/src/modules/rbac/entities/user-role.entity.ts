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

import { UserEntity } from '../../users/entities/users.entity';

import { RoleEntity } from './role.entity';

@Entity('user_roles')
@Unique('UQ_user_roles_user_id_role_id', ['userId', 'roleId'])
export class UserRoleEntity {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_user_roles' })
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'FK_user_roles_user_id',
  })
  user: UserEntity;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId: string;

  @ManyToOne(() => RoleEntity, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({
    name: 'role_id',
    foreignKeyConstraintName: 'FK_user_roles_role_id',
  })
  role: RoleEntity;

  @CreateDateColumn({ name: 'created_at', select: false })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', select: false })
  updatedAt: Date;
}
