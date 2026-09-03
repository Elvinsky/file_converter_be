import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcrypt';
import { randomInt } from 'crypto';
import { LessThan, Repository } from 'typeorm';

import { ConfigService } from '@/core/config/config.service';

import { CreateOtpDto } from '../dto/create-otp.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { OtpEntity } from '../entities/otp.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

const BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(OtpEntity)
    private readonly otpRepository: Repository<OtpEntity>,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async removeExpiredOtps() {
    await this.otpRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  async createOtp(createOtpDto: CreateOtpDto): Promise<{ code: string }> {
    const length = this.configService.get('OTP_LENGTH');
    const ttlSeconds = this.configService.get('OTP_TTL_SECONDS');
    const code = this.generateNumericCode(length);
    const otpHash = await hash(code, BCRYPT_SALT_ROUNDS);

    await this.otpRepository.delete({ email: createOtpDto.email });

    await this.otpRepository.save(
      this.otpRepository.create({
        userId: createOtpDto.userId,
        email: createOtpDto.email,
        otpHash,
        expiresAt: new Date(Date.now() + ttlSeconds * 1000),
        attempts: 0,
      }),
    );

    return { code };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<OtpEntity> {
    const maxAttempts = this.configService.get('OTP_MAX_ATTEMPTS');

    const otpEntity = await this.otpRepository
      .createQueryBuilder('otp')
      .addSelect('otp.otpHash')
      .where('otp.email = :email', { email: verifyOtpDto.email })
      .andWhere('otp.expires_at > :now', { now: new Date() })
      .orderBy('otp.created_at', 'DESC')
      .getOne();

    if (!otpEntity || otpEntity.attempts >= maxAttempts) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const isValid = await compare(verifyOtpDto.code, otpEntity.otpHash);

    if (!isValid) {
      otpEntity.attempts += 1;
      await this.otpRepository.save(otpEntity);

      if (otpEntity.attempts >= maxAttempts) {
        await this.otpRepository.delete({ id: otpEntity.id });
      }

      throw new UnauthorizedException('Invalid or expired OTP');
    }

    await this.otpRepository.delete({ email: verifyOtpDto.email });

    return otpEntity;
  }

  private generateNumericCode(length: number): string {
    const max = 10 ** length;
    return String(randomInt(0, max)).padStart(length, '0');
  }
}
