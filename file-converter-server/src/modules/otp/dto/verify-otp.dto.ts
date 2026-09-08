import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: 'user@example.com' })
  @Transform(({ value }: { value: string }) => value.trim().toLowerCase())
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456', minLength: 4, maxLength: 8 })
  @IsString()
  @IsNotEmpty()
  @Length(4, 8)
  code: string;
}
