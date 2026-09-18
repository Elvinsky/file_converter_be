import { BadRequestException, Controller, Post, Req } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import '@fastify/multipart';

import { AuthenticatedRequest } from '@/modules/auth/types/authenticated-request';
import {
  RBAC_ACTIONS,
  RBAC_RESOURCES,
} from '@/modules/rbac/decorators/require-permission.constants';
import { RequirePermission } from '@/modules/rbac/decorators/require-permission.decorator';

import { TestUploadResponseDto } from '../dto/test-upload-response.dto';
import { FilesService } from '../services/files.service';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @RequirePermission(RBAC_RESOURCES.MY_FILES, RBAC_ACTIONS.CREATE)
  @Post('test-upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Upload a test file',
    description:
      'Receives a multipart file and stores it in the configured S3-compatible bucket (MinIO locally).',
  })
  @ApiCreatedResponse({ type: TestUploadResponseDto })
  async testUpload(@Req() request: Request & AuthenticatedRequest) {
    const file = await request.file();

    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.filesService.storeTestUpload(request.user.id, file);
  }
}
