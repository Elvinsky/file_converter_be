import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateGrantDto, UpdateGrantDto } from '../dto/grant.dto';
import { GrantEntity } from '../entities/grant.entity';
import { assertGrantActions, assertGrantAvailable } from '../utilities/asserts';
import { PermissionService } from './permission.service';
import { RoleService } from './role.service';

@Injectable()
export class GrantService {
  constructor(
    @InjectRepository(GrantEntity)
    private readonly grantRepository: Repository<GrantEntity>,
    private readonly roleService: RoleService,
    private readonly permissionService: PermissionService,
  ) {}

  async getGrants(): Promise<GrantEntity[]> {
    return this.grantRepository.find({
      order: { roleId: 'ASC', permissionId: 'ASC' },
    });
  }

  async getGrantById(id: string): Promise<GrantEntity> {
    const grant = await this.grantRepository.findOne({ where: { id } });
    if (!grant) {
      throw new NotFoundException('Grant not found');
    }

    return grant;
  }

  async createGrant(dto: CreateGrantDto): Promise<GrantEntity> {
    await this.roleService.getRoleById(dto.roleId);
    const permission = await this.permissionService.getPermissionById(
      dto.permissionId,
    );
    const actions = assertGrantActions(dto.actions, permission);

    await assertGrantAvailable(
      this.grantRepository,
      dto.roleId,
      dto.permissionId,
    );

    const grant = this.grantRepository.create({
      roleId: dto.roleId,
      permissionId: dto.permissionId,
      actions,
    });

    return this.grantRepository.save(grant);
  }

  async updateGrant(id: string, dto: UpdateGrantDto): Promise<GrantEntity> {
    const grant = await this.getGrantById(id);
    const roleId = dto.roleId ?? grant.roleId;
    const permissionId = dto.permissionId ?? grant.permissionId;

    await this.roleService.getRoleById(roleId);
    const permission =
      await this.permissionService.getPermissionById(permissionId);

    if (roleId !== grant.roleId || permissionId !== grant.permissionId) {
      await assertGrantAvailable(
        this.grantRepository,
        roleId,
        permissionId,
        id,
      );
    }

    grant.roleId = roleId;
    grant.permissionId = permissionId;
    grant.actions = assertGrantActions(
      dto.actions !== undefined ? dto.actions : grant.actions,
      permission,
    );

    return this.grantRepository.save(grant);
  }

  async deleteGrant(id: string): Promise<void> {
    const grant = await this.getGrantById(id);
    await this.grantRepository.remove(grant);
  }
}
