import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { RoleEntity } from '../entities/role.entity';
import { UserRoleEntity } from '../entities/user-role.entity';
import { RbacService } from '../services/rbac.service';

describe('RbacService roles', () => {
  let service: RbacService;
  const roleRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const userRoleRepository = {
    count: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        RbacService,
        { provide: getRepositoryToken(RoleEntity), useValue: roleRepository },
        {
          provide: getRepositoryToken(UserRoleEntity),
          useValue: userRoleRepository,
        },
      ],
    }).compile();

    service = module.get(RbacService);
  });

  it('creates a role when the name is unique', async () => {
    const created = { id: 'role-1', name: 'admin', description: null };
    roleRepository.findOne.mockResolvedValue(null);
    roleRepository.create.mockReturnValue(created);
    roleRepository.save.mockResolvedValue(created);

    await expect(service.createRole({ name: 'admin' })).resolves.toEqual(
      created,
    );
  });

  it('rejects a duplicate role name', async () => {
    roleRepository.findOne.mockResolvedValue({ id: 'role-1', name: 'admin' });

    await expect(service.createRole({ name: 'admin' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects deleting a missing role', async () => {
    roleRepository.findOne.mockResolvedValue(null);

    await expect(service.deleteRole('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects deleting a role assigned to users', async () => {
    roleRepository.findOne.mockResolvedValue({ id: 'role-1', name: 'admin' });
    userRoleRepository.count.mockResolvedValue(1);

    await expect(service.deleteRole('role-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(roleRepository.remove).not.toHaveBeenCalled();
  });
});
