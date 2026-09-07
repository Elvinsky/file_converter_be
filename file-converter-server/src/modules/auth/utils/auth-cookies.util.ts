import { FastifyReply } from 'fastify';

import { ConfigService } from '@/core/config/config.service';

import { TokenPair } from '@/modules/jwt/jwt.types';

const DURATION_PATTERN = /^(\d+)([smhd])$/;

function parseDurationToSeconds(duration: string): number {
  const match = duration.match(DURATION_PATTERN);

  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 24 * 60 * 60;
    default:
      throw new Error(`Unsupported duration unit: ${unit}`);
  }
}

export function setAuthCookies(
  reply: FastifyReply,
  tokens: TokenPair,
  configService: ConfigService,
): void {
  const isProduction = configService.get('NODE_ENV') === 'production';

  reply.setCookie('access_token', tokens.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: parseDurationToSeconds(configService.get('JWT_EXPIRES_IN')),
  });

  reply.setCookie('refresh_token', tokens.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/auth/refresh',
    maxAge: parseDurationToSeconds(
      configService.get('JWT_REFRESH_TOKEN_EXPIRES_IN'),
    ),
  });
}

export function clearAuthCookies(reply: FastifyReply): void {
  reply.clearCookie('access_token', { path: '/' });
  reply.clearCookie('refresh_token', { path: '/auth/refresh' });
}
