import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class UpdateUserRolesDto {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    example: ['11111111-1111-1111-1111-111111111111'],
    description:
      'Full set of role ids for the user. Replaces current assignments.',
  })
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  roleIds: string[];
}
