import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';

import { JwtService } from '@/modules/jwt/services/jwt.service';
import { UsersService } from '@/modules/users/services/users.service';

import type { AuthenticatedRequest } from '../types/authenticated-request';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const accessToken = request.cookies?.access_token;

    if (!accessToken) {
      throw new UnauthorizedException('Access token is missing');
    }

    const payload = this.jwtService.verifyAccessToken(accessToken);
    const user = await this.usersService.findUserById(payload.sub);

    if (!user || user.tokenVersion !== payload.ver) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    request.user = {
      id: payload.sub,
      email: payload.email,
    };

    return true;
  }
}
