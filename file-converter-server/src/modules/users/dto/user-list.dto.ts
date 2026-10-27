import { ApiProperty } from '@nestjs/swagger';

export class UserListItemDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty()
  isActive: boolean;
}

export class UserListDto {
  @ApiProperty({ type: [UserListItemDto] })
  items: UserListItemDto[];

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 42 })
  total: number;
}
