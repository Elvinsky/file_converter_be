import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'admin' })
  name: string;

  @ApiPropertyOptional({
    example: 'Full access to administration',
    nullable: true,
  })
  description: string | null;
}

export class DeleteRoleResponseDto {
  @ApiProperty({ example: 'Role deleted successfully' })
  message: string;

  @ApiProperty({ format: 'uuid' })
  id: string;
}
