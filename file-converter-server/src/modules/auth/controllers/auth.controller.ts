import { Body, Controller, Post } from '@nestjs/common';

import { AuthService } from '../services/auth.service';

import { RegisterDto } from '../dto/register.dto';
import { VerifyOtpDto } from '@/modules/otp/dto/verify-otp.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
  @Post('verify-otp')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOTP(verifyOtpDto);
  }
}
