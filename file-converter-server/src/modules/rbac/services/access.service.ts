import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { GrantEntity } from '../entities/grant.entity';
import { UserRoleEntity } from '../entities/user-role.entity';

export type AccessCheckInput = {
  userId: string;
  permission: string;
  action: string;
};

@Injectable()
export class AccessService {
  constructor(
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepository: Repository<UserRoleEntity>,
    @InjectRepository(GrantEntity)
    private readonly grantRepository: Repository<GrantEntity>,
  ) {}

  async canAccess(input: AccessCheckInput): Promise<boolean> {
    const assignments = await this.userRoleRepository.find({
      where: { userId: input.userId },
    });

    if (assignments.length === 0) {
      return false;
    }

    const grants = await this.grantRepository.find({
      where: { roleId: In(assignments.map((assignment) => assignment.roleId)) },
      relations: { permission: true },
    });

    return grants.some((grant) => this.grantAllows(grant, input));
  }

  private grantAllows(grant: GrantEntity, input: AccessCheckInput): boolean {
    if (grant.permission.name !== input.permission) {
      return false;
    }

    if (!grant.permission.actions.includes(input.action)) {
      return false;
    }

    if (grant.actions == null || grant.actions.length === 0) {
      return true;
    }

    return grant.actions.includes(input.action);
  }
}
