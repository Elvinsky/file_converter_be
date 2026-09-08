import { ApiProperty } from '@nestjs/swagger';

import { UserRole } from '@/modules/users/entities/users.entity';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.User })
  role: UserRole;

  @ApiProperty({
    example: false,
    description: 'False until the registration OTP is verified.',
  })
  isActive: boolean;
}

export class AuthUserDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.User })
  role: UserRole;
}

export class TokenPairDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ description: 'JWT refresh token' })
  refreshToken: string;
}

export class LoginResponseDto {
  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;

  @ApiProperty({ type: TokenPairDto })
  tokens: TokenPairDto;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'Email verified' })
  message: string;
}
