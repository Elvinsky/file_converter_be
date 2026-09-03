import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OtpEntity } from '../entities/otp.entity';
import { OtpService } from '../services/otp.service';

@Module({
  imports: [TypeOrmModule.forFeature([OtpEntity])],
  providers: [OtpService],
  exports: [TypeOrmModule, OtpService],
})
export class OtpModule {}
