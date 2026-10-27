import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

import { ConfigService } from '@/core/config/config.service';

import {
  AccessTokenPayload,
  AuthUserPayload,
  RefreshTokenPayload,
  TokenPair,
} from '../jwt.types';

@Injectable()
export class JwtService {
  constructor(private readonly configService: ConfigService) {}

  createTokenPair(user: AuthUserPayload, tokenVersion: number): TokenPair {
    return {
      accessToken: this.generateAccessToken(user, tokenVersion),
      refreshToken: this.generateRefreshToken(user.id, tokenVersion),
    };
  }

  refreshTokenPair(
    refreshToken: string,
    user: AuthUserPayload,
    tokenVersion: number,
  ): TokenPair {
    const payload = this.verifyRefreshToken(refreshToken);

    if (payload.sub !== user.id || payload.ver !== tokenVersion) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.createTokenPair(user, tokenVersion);
  }

  generateAccessToken(user: AuthUserPayload, tokenVersion: number): string {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      type: 'access',
      ver: tokenVersion,
    };

    return jwt.sign(payload, this.getSecret(), {
      expiresIn: this.getAccessExpiresIn(),
    });
  }

  generateRefreshToken(userId: string, tokenVersion: number): string {
    const payload: RefreshTokenPayload = {
      sub: userId,
      type: 'refresh',
      ver: tokenVersion,
    };

    return jwt.sign(payload, this.getSecret(), {
      expiresIn: this.getRefreshExpiresIn(),
    });
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const payload = this.verifyToken(token);

    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid access token');
    }

    return payload as AccessTokenPayload;
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    const payload = this.verifyToken(token);

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return payload as RefreshTokenPayload;
  }

  private verifyToken(token: string): jwt.JwtPayload & {
    type?: string;
    sub?: string;
    email?: string;
    ver?: number;
  } {
    try {
      return jwt.verify(token, this.getSecret()) as jwt.JwtPayload & {
        type?: string;
        sub?: string;
        email?: string;
        ver?: number;
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private getSecret(): string {
    return this.configService.get('JWT_SECRET');
  }

  private getAccessExpiresIn(): jwt.SignOptions['expiresIn'] {
    return this.configService.get(
      'JWT_EXPIRES_IN',
    ) as jwt.SignOptions['expiresIn'];
  }

  private getRefreshExpiresIn(): jwt.SignOptions['expiresIn'] {
    return this.configService.get(
      'JWT_REFRESH_TOKEN_EXPIRES_IN',
    ) as jwt.SignOptions['expiresIn'];
  }
}
