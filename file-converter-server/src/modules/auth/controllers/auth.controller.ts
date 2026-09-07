import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { ConfigService } from '@/core/config/config.service';
import { VerifyOtpDto } from '@/modules/otp/dto/verify-otp.dto';

import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { clearAuthCookies, setAuthCookies } from '../utils/auth-cookies.util';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOTP(verifyOtpDto);
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const { user, tokens } = await this.authService.login(loginDto);

    setAuthCookies(reply, tokens, this.configService);

    return { user, tokens };
  }

  @Post('refresh')
  async refresh(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const refreshToken = request.cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const tokens = await this.authService.refresh(refreshToken);

    setAuthCookies(reply, tokens, this.configService);

    return { message: 'Token refreshed' };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) reply: FastifyReply) {
    clearAuthCookies(reply);

    return { message: 'Logged out' };
  }
}
