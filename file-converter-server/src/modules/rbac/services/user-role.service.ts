import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UsersService } from '@/modules/users/services/users.service';

import { UpdateUserRolesDto } from '../dto/user-role.dto';
import { RoleEntity } from '../entities/role.entity';
import { UserRoleEntity } from '../entities/user-role.entity';
import { assertRolesExist } from '../utilities/asserts';
import { RoleService } from './role.service';

@Injectable()
export class UserRoleService {
  constructor(
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepository: Repository<UserRoleEntity>,
    private readonly roleService: RoleService,
    private readonly usersService: UsersService,
  ) {}

  async getUserRoles(userId: string): Promise<RoleEntity[]> {
    await this.usersService.getUserById(userId);

    const assignments = await this.userRoleRepository.find({
      where: { userId },
      relations: { role: true },
    });

    return assignments
      .map((assignment) => assignment.role)
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  async replaceUserRoles(
    userId: string,
    dto: UpdateUserRolesDto,
  ): Promise<RoleEntity[]> {
    await this.usersService.getUserById(userId);

    const roles = await this.roleService.findRolesByIds(dto.roleIds);
    assertRolesExist(roles, dto.roleIds);

    await this.userRoleRepository.delete({ userId });

    if (dto.roleIds.length > 0) {
      const assignments = dto.roleIds.map((roleId) =>
        this.userRoleRepository.create({ userId, roleId }),
      );
      await this.userRoleRepository.save(assignments);
    }

    return this.getUserRoles(userId);
  }
}
