import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { UsersService } from '@/modules/users/services/users.service';

import { GrantEntity } from '../entities/grant.entity';
import { PermissionEntity } from '../entities/permission.entity';
import { RoleEntity } from '../entities/role.entity';
import { UserRoleEntity } from '../entities/user-role.entity';
import { GrantService } from '../services/grant.service';
import { PermissionService } from '../services/permission.service';
import { RoleService } from '../services/role.service';
import { UserRoleService } from '../services/user-role.service';

describe('RBAC services', () => {
  let roleService: RoleService;
  let permissionService: PermissionService;
  let grantService: GrantService;
  let userRoleService: UserRoleService;

  const roleRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const permissionRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const grantRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const userRoleRepository = {
    count: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const usersService = {
    getUserById: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        RoleService,
        PermissionService,
        GrantService,
        UserRoleService,
        { provide: getRepositoryToken(RoleEntity), useValue: roleRepository },
        {
          provide: getRepositoryToken(PermissionEntity),
          useValue: permissionRepository,
        },
        {
          provide: getRepositoryToken(GrantEntity),
          useValue: grantRepository,
        },
        {
          provide: getRepositoryToken(UserRoleEntity),
          useValue: userRoleRepository,
        },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    roleService = module.get(RoleService);
    permissionService = module.get(PermissionService);
    grantService = module.get(GrantService);
    userRoleService = module.get(UserRoleService);
  });

  describe('roles', () => {
    it('creates a role when the name is unique', async () => {
      const created = { id: 'role-1', name: 'admin', description: null };
      roleRepository.findOne.mockResolvedValue(null);
      roleRepository.create.mockReturnValue(created);
      roleRepository.save.mockResolvedValue(created);

      await expect(roleService.createRole({ name: 'admin' })).resolves.toEqual(
        created,
      );
    });

    it('rejects a duplicate role name', async () => {
      roleRepository.findOne.mockResolvedValue({
        id: 'role-1',
        name: 'admin',
      });

      await expect(
        roleService.createRole({ name: 'admin' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects deleting a missing role', async () => {
      roleRepository.findOne.mockResolvedValue(null);

      await expect(roleService.deleteRole('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects deleting a role assigned to users', async () => {
      roleRepository.findOne.mockResolvedValue({
        id: 'role-1',
        name: 'admin',
      });
      userRoleRepository.count.mockResolvedValue(1);

      await expect(roleService.deleteRole('role-1')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(roleRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('permissions', () => {
    it('creates a permission when the name is unique', async () => {
      const created = {
        id: 'perm-1',
        name: 'users',
        actions: ['read', 'update'],
      };
      permissionRepository.findOne.mockResolvedValue(null);
      permissionRepository.create.mockReturnValue(created);
      permissionRepository.save.mockResolvedValue(created);

      await expect(
        permissionService.createPermission({
          name: 'users',
          actions: ['read', 'update'],
        }),
      ).resolves.toEqual(created);
    });

    it('rejects a duplicate permission name', async () => {
      permissionRepository.findOne.mockResolvedValue({
        id: 'perm-1',
        name: 'users',
      });

      await expect(
        permissionService.createPermission({
          name: 'users',
          actions: ['read'],
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects deleting a missing permission', async () => {
      permissionRepository.findOne.mockResolvedValue(null);

      await expect(
        permissionService.deletePermission('missing'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('deletes a permission and lets grants cascade', async () => {
      const permission = {
        id: 'perm-1',
        name: 'users',
        actions: ['read'],
      };
      permissionRepository.findOne.mockResolvedValue(permission);
      permissionRepository.remove.mockResolvedValue(permission);

      await permissionService.deletePermission('perm-1');

      expect(permissionRepository.remove).toHaveBeenCalledWith(permission);
    });
  });

  describe('grants', () => {
    const role = { id: 'role-1', name: 'admin' };
    const permission = {
      id: 'perm-1',
      name: 'users',
      actions: ['read', 'update', 'delete'],
    };

    it('creates a grant with all actions when actions are omitted', async () => {
      const created = {
        id: 'grant-1',
        roleId: role.id,
        permissionId: permission.id,
        actions: null,
      };
      roleRepository.findOne.mockResolvedValue(role);
      permissionRepository.findOne.mockResolvedValue(permission);
      grantRepository.findOne.mockResolvedValue(null);
      grantRepository.create.mockReturnValue(created);
      grantRepository.save.mockResolvedValue(created);

      await expect(
        grantService.createGrant({
          roleId: role.id,
          permissionId: permission.id,
        }),
      ).resolves.toEqual(created);
      expect(grantRepository.create).toHaveBeenCalledWith({
        roleId: role.id,
        permissionId: permission.id,
        actions: null,
      });
    });

    it('rejects a duplicate role and permission pair', async () => {
      roleRepository.findOne.mockResolvedValue(role);
      permissionRepository.findOne.mockResolvedValue(permission);
      grantRepository.findOne.mockResolvedValue({ id: 'grant-1' });

      await expect(
        grantService.createGrant({
          roleId: role.id,
          permissionId: permission.id,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects grant actions that are not on the permission', async () => {
      roleRepository.findOne.mockResolvedValue(role);
      permissionRepository.findOne.mockResolvedValue(permission);

      await expect(
        grantService.createGrant({
          roleId: role.id,
          permissionId: permission.id,
          actions: ['create'],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects deleting a missing grant', async () => {
      grantRepository.findOne.mockResolvedValue(null);

      await expect(grantService.deleteGrant('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('user roles', () => {
    const userId = 'user-1';
    const adminRole = { id: 'role-admin', name: 'admin' };
    const userRole = { id: 'role-user', name: 'user' };

    it('lists roles assigned to a user', async () => {
      usersService.getUserById.mockResolvedValue({ id: userId });
      userRoleRepository.find.mockResolvedValue([
        { userId, roleId: adminRole.id, role: adminRole },
        { userId, roleId: userRole.id, role: userRole },
      ]);

      await expect(userRoleService.getUserRoles(userId)).resolves.toEqual([
        adminRole,
        userRole,
      ]);
    });

    it('rejects listing roles for a missing user', async () => {
      usersService.getUserById.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(userRoleService.getUserRoles(userId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("replaces a user's roles", async () => {
      usersService.getUserById.mockResolvedValue({ id: userId });
      roleRepository.find.mockResolvedValue([adminRole]);
      userRoleRepository.delete.mockResolvedValue({ affected: 1 });
      userRoleRepository.create.mockImplementation(
        (value: { userId: string; roleId: string }) => value,
      );
      userRoleRepository.save.mockResolvedValue([]);
      userRoleRepository.find.mockResolvedValue([
        { userId, roleId: adminRole.id, role: adminRole },
      ]);

      await expect(
        userRoleService.replaceUserRoles(userId, { roleIds: [adminRole.id] }),
      ).resolves.toEqual([adminRole]);
      expect(userRoleRepository.delete).toHaveBeenCalledWith({ userId });
    });

    it('rejects replace when a role id does not exist', async () => {
      usersService.getUserById.mockResolvedValue({ id: userId });
      roleRepository.find.mockResolvedValue([]);

      await expect(
        userRoleService.replaceUserRoles(userId, { roleIds: [adminRole.id] }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(userRoleRepository.delete).not.toHaveBeenCalled();
    });
  });
});
