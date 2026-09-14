import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  CreatePermissionDto,
  UpdatePermissionDto,
} from '../dto/permission.dto';
import { PermissionEntity } from '../entities/permission.entity';
import { assertPermissionNameAvailable } from '../utilities/asserts';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(PermissionEntity)
    private readonly permissionRepository: Repository<PermissionEntity>,
  ) {}

  async getPermissions(): Promise<PermissionEntity[]> {
    return this.permissionRepository.find({ order: { name: 'ASC' } });
  }

  async getPermissionById(id: string): Promise<PermissionEntity> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return permission;
  }

  async createPermission(dto: CreatePermissionDto): Promise<PermissionEntity> {
    await assertPermissionNameAvailable(this.permissionRepository, dto.name);

    const permission = this.permissionRepository.create({
      name: dto.name,
      actions: dto.actions,
    });

    return this.permissionRepository.save(permission);
  }

  async updatePermission(
    id: string,
    dto: UpdatePermissionDto,
  ): Promise<PermissionEntity> {
    const permission = await this.getPermissionById(id);

    if (dto.name !== undefined && dto.name !== permission.name) {
      await assertPermissionNameAvailable(this.permissionRepository, dto.name);
      permission.name = dto.name;
    }

    if (dto.actions !== undefined) {
      permission.actions = dto.actions;
    }

    return this.permissionRepository.save(permission);
  }

  async deletePermission(id: string): Promise<void> {
    const permission = await this.getPermissionById(id);
    await this.permissionRepository.remove(permission);
  }
}
