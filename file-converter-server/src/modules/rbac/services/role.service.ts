import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { CreateRoleDto, UpdateRoleDto } from '../dto/role.dto';
import { RoleEntity } from '../entities/role.entity';
import { UserRoleEntity } from '../entities/user-role.entity';
import {
  assertRoleNameAvailable,
  assertRoleNotAssignedToUsers,
} from '../utilities/asserts';

@Injectable()
export class RoleService {
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

  async findRolesByIds(ids: string[]): Promise<RoleEntity[]> {
    if (ids.length === 0) {
      return [];
    }

    return this.roleRepository.find({ where: { id: In(ids) } });
  }

  async createRole(dto: CreateRoleDto): Promise<RoleEntity> {
    await assertRoleNameAvailable(this.roleRepository, dto.name);

    const role = this.roleRepository.create({
      name: dto.name,
      description: dto.description ?? null,
    });

    return this.roleRepository.save(role);
  }

  async updateRole(id: string, dto: UpdateRoleDto): Promise<RoleEntity> {
    const role = await this.getRoleById(id);

    if (dto.name !== undefined && dto.name !== role.name) {
      await assertRoleNameAvailable(this.roleRepository, dto.name);
      role.name = dto.name;
    }

    if (dto.description !== undefined) {
      role.description = dto.description;
    }

    return this.roleRepository.save(role);
  }

  async deleteRole(id: string): Promise<void> {
    const role = await this.getRoleById(id);
    await assertRoleNotAssignedToUsers(this.userRoleRepository, id);
    await this.roleRepository.remove(role);
  }
}
