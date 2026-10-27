import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

import { ConfigService } from '@/core/config/config.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { AuthService } from '@/modules/auth/services/auth.service';
import { JwtService } from '@/modules/jwt/services/jwt.service';

const USER_ID = '11111111-1111-4111-8111-111111111111';

function jwtConfig(): ConfigService {
  return {
    get: (key: string) => {
      if (key === 'JWT_SECRET') {
        return 'test-secret-test-secret-test-secret';
      }

      if (key === 'JWT_EXPIRES_IN') {
        return '1h';
      }

      if (key === 'JWT_REFRESH_TOKEN_EXPIRES_IN') {
        return '7d';
      }

      return undefined;
    },
  } as ConfigService;
}

function requestContext(accessToken?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        cookies: accessToken ? { access_token: accessToken } : {},
      }),
    }),
  } as ExecutionContext;
}

describe('logout token revocation', () => {
  const jwt = new JwtService(jwtConfig());
  let version = 0;
  const users = {
    findUserById: jest.fn(() =>
      Promise.resolve({
        id: USER_ID,
        email: 'user@example.com',
        isActive: true,
        tokenVersion: version,
      }),
    ),
    incrementTokenVersion: jest.fn(() => {
      version += 1;
      return Promise.resolve();
    }),
  };
  const auth = new AuthService(users as never, {} as never, {} as never, jwt);
  const guard = new JwtAuthGuard(jwt, users as never);

  beforeEach(() => {
    version = 0;
    users.findUserById.mockClear();
    users.incrementTokenVersion.mockClear();
  });

  it('rejects the same access and refresh tokens after logout', async () => {
    const tokens = jwt.createTokenPair(
      { id: USER_ID, email: 'user@example.com' },
      0,
    );

    await expect(
      guard.canActivate(requestContext(tokens.accessToken)),
    ).resolves.toBe(true);
    const refreshed = await auth.refresh(tokens.refreshToken);

    expect(typeof refreshed.accessToken).toBe('string');
    expect(typeof refreshed.refreshToken).toBe('string');

    await auth.logout(tokens.accessToken);

    expect(users.incrementTokenVersion).toHaveBeenCalledWith(USER_ID);
    await expect(
      guard.canActivate(requestContext(tokens.accessToken)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(auth.refresh(tokens.refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('still logs out when the presented token cannot be verified', async () => {
    await expect(auth.logout('not-a-token')).resolves.toBeUndefined();
    expect(users.incrementTokenVersion).not.toHaveBeenCalled();
  });
});
