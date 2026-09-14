import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('rbac_roles')
@Unique('UQ_rbac_roles_name', ['name'])
export class RoleEntity {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_rbac_roles' })
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at', select: false })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', select: false })
  updatedAt: Date;
}
