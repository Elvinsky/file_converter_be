import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateOtpDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @Transform(({ value }: { value: string }) => value.trim().toLowerCase())
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
