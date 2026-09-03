import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  Admin = 'admin',
  User = 'user',
}

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 16, default: UserRole.User })
  role: UserRole;

  @Column({ name: 'is_active', default: false })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', select: false })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', select: false })
  updatedAt: Date;
}
