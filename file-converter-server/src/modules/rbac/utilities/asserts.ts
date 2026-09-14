import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Not, Repository } from 'typeorm';

import { GrantEntity } from '../entities/grant.entity';
import { PermissionEntity } from '../entities/permission.entity';
import { RoleEntity } from '../entities/role.entity';
import { UserRoleEntity } from '../entities/user-role.entity';

export async function assertRoleNameAvailable(
  roleRepository: Repository<RoleEntity>,
  name: string,
): Promise<void> {
  const existing = await roleRepository.findOne({ where: { name } });
  if (existing) {
    throw new ConflictException('Role name already exists');
  }
}

export async function assertPermissionNameAvailable(
  permissionRepository: Repository<PermissionEntity>,
  name: string,
): Promise<void> {
  const existing = await permissionRepository.findOne({ where: { name } });
  if (existing) {
    throw new ConflictException('Permission name already exists');
  }
}

export async function assertGrantAvailable(
  grantRepository: Repository<GrantEntity>,
  roleId: string,
  permissionId: string,
  excludeId?: string,
): Promise<void> {
  const existing = await grantRepository.findOne({
    where: excludeId
      ? { roleId, permissionId, id: Not(excludeId) }
      : { roleId, permissionId },
  });

  if (existing) {
    throw new ConflictException(
      'Grant for this role and permission already exists',
    );
  }
}

export async function assertRoleNotAssignedToUsers(
  userRoleRepository: Repository<UserRoleEntity>,
  roleId: string,
): Promise<void> {
  const assignedUsers = await userRoleRepository.count({
    where: { roleId },
  });

  if (assignedUsers > 0) {
    throw new ConflictException(
      'Cannot delete a role that is assigned to users',
    );
  }
}

export function assertRolesExist(found: RoleEntity[], roleIds: string[]): void {
  if (found.length !== roleIds.length) {
    throw new NotFoundException('Role not found');
  }
}

export function assertGrantActions(
  actions: string[] | null | undefined,
  permission: PermissionEntity,
): string[] | null {
  if (actions == null || actions.length === 0) {
    return null;
  }

  const allowed = new Set(permission.actions);
  const invalid = actions.filter((action) => !allowed.has(action));

  if (invalid.length > 0) {
    throw new BadRequestException(
      'Grant actions must be a subset of the permission actions',
    );
  }

  return actions;
}
