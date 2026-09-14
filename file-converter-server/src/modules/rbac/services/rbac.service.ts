import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { RoleEntity } from '../entities/role.entity';
import { UserRoleEntity } from '../entities/user-role.entity';

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepository: Repository<UserRoleEntity>,
  ) {}

  async getRoles(): Promise<RoleEntity[]> {
    return this.roleRepository.find({ order: { name: 'ASC' } });
  }

  async getRoleById(id: string): Promise<RoleEntity> {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async createRole(dto: CreateRoleDto): Promise<RoleEntity> {
    await this.assertRoleNameAvailable(dto.name);

    const role = this.roleRepository.create({
      name: dto.name,
      description: dto.description ?? null,
    });

    return this.roleRepository.save(role);
  }

  async updateRole(id: string, dto: UpdateRoleDto): Promise<RoleEntity> {
    const role = await this.getRoleById(id);

    if (dto.name !== undefined && dto.name !== role.name) {
      await this.assertRoleNameAvailable(dto.name);
      role.name = dto.name;
    }

    if (dto.description !== undefined) {
      role.description = dto.description;
    }

    return this.roleRepository.save(role);
  }

  async deleteRole(id: string): Promise<void> {
    const role = await this.getRoleById(id);

    const assignedUsers = await this.userRoleRepository.count({
      where: { roleId: id },
    });

    if (assignedUsers > 0) {
      throw new ConflictException(
        'Cannot delete a role that is assigned to users',
      );
    }

    await this.roleRepository.remove(role);
  }

  private async assertRoleNameAvailable(name: string): Promise<void> {
    const existing = await this.roleRepository.findOne({ where: { name } });
    if (existing) {
      throw new ConflictException('Role name already exists');
    }
  }
}
