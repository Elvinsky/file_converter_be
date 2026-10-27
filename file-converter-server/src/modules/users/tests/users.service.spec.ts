import { validate } from 'class-validator';

import { ListUsersQueryDto } from '../dto/list-users-query.dto';
import { UsersService } from '../services/users.service';

describe('ListUsersQueryDto', () => {
  it('accepts an omitted page and limit', async () => {
    await expect(validate(new ListUsersQueryDto())).resolves.toHaveLength(0);
  });

  it('rejects a limit above 100', async () => {
    const dto = new ListUsersQueryDto();
    dto.limit = '101';

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });

  it('rejects a page below 1', async () => {
    const dto = new ListUsersQueryDto();
    dto.page = '0';

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });
});

describe('UsersService.getUsers', () => {
  const findAndCount = jest.fn();
  const service = new UsersService(
    { findAndCount } as never,
    { assignDefaultUserRole: jest.fn() } as never,
  );

  it('returns the first page without a password hash', async () => {
    findAndCount.mockResolvedValue([
      [
        {
          id: '11111111-1111-4111-8111-111111111111',
          email: 'ada@example.com',
          isActive: true,
          passwordHash: 'secret',
        },
      ],
      1,
    ]);

    await expect(service.getUsers()).resolves.toEqual({
      items: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          email: 'ada@example.com',
          isActive: true,
        },
      ],
      page: 1,
      limit: 20,
      total: 1,
    });
    expect(findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 20,
        order: { email: 'ASC' },
      }),
    );
  });

  it('returns an empty page past the end with the total', async () => {
    findAndCount.mockResolvedValue([[], 5]);

    await expect(service.getUsers(3, 20)).resolves.toEqual({
      items: [],
      page: 3,
      limit: 20,
      total: 5,
    });
    expect(findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 40, take: 20 }),
    );
  });
});
