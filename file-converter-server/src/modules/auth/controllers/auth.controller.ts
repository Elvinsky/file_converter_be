import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { ConfigService } from '@/core/config/config.service';
import { VerifyOtpDto } from '@/modules/otp/dto/verify-otp.dto';

import { AuthService } from '../services/auth.service';
import {
  LoginResponseDto,
  MessageResponseDto,
  UserResponseDto,
} from '../dto/auth-response.dto';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { clearAuthCookies, setAuthCookies } from '../utils/auth-cookies.util';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates an inactive user account and emails a one-time passcode for verification.',
  })
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('verify-otp')
  @ApiOperation({
    summary: 'Verify registration OTP',
    description: 'Activates the user account when the emailed OTP is valid.',
  })
  @ApiCreatedResponse({ type: MessageResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired OTP' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOTP(verifyOtpDto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Log in',
    description:
      'Authenticates an active user and sets httpOnly access_token and refresh_token cookies.',
  })
  @ApiCreatedResponse({ type: LoginResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const { user, tokens } = await this.authService.login(loginDto);

    setAuthCookies(reply, tokens, this.configService);

    return { user, tokens };
  }

  @Post('refresh')
  @ApiCookieAuth('refresh_token')
  @ApiOperation({
    summary: 'Refresh tokens',
    description:
      'Issues a new token pair from the httpOnly refresh_token cookie and updates auth cookies.',
  })
  @ApiCreatedResponse({ type: MessageResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Refresh token is missing or invalid',
  })
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
  @ApiOperation({
    summary: 'Log out',
    description: 'Clears the access_token and refresh_token cookies.',
  })
  @ApiCreatedResponse({ type: MessageResponseDto })
  logout(@Res({ passthrough: true }) reply: FastifyReply) {
    clearAuthCookies(reply);

    return { message: 'Logged out' };
  }
}
