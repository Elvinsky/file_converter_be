import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import '@fastify/multipart';

import { AuthenticatedRequest } from '@/modules/auth/types/authenticated-request';
import {
  RBAC_ACTIONS,
  RBAC_RESOURCES,
} from '@/modules/rbac/decorators/require-permission.constants';
import { RequirePermission } from '@/modules/rbac/decorators/require-permission.decorator';

import { FileResponseDto } from '../dto/file-response.dto';
import { ListFilesQueryDto } from '../dto/list-files-query.dto';
import { UploadFileDto } from '../dto/upload-file.dto';
import { FilesService } from '../services/files.service';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @RequirePermission(RBAC_RESOURCES.MY_FILES, RBAC_ACTIONS.CREATE)
  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadFileDto })
  @ApiOperation({
    summary: 'Upload a file',
    description:
      'Accepts a multipart file, stores it in S3-compatible storage, and returns metadata including the publisher email. Requires permission `my-files` + `create`.',
  })
  @ApiCreatedResponse({ type: FileResponseDto })
  @ApiBadRequestResponse({
    description: 'File is missing, too large (over 10 MB), or invalid',
  })
  async upload(@Req() request: Request & AuthenticatedRequest) {
    const file = await request.file();

    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.filesService.upload(request.user.id, file);
  }

  @RequirePermission(RBAC_RESOURCES.MY_FILES, RBAC_ACTIONS.READ)
  @Get()
  @ApiOperation({
    summary: 'List files',
    description:
      'Returns file metadata including `publisherEmail`. Callers with `files-list` + `read` (admins) get every file; other users get only their own. Optional `userId` filters to one publisher (admins: any user; others: only themselves). Requires permission `my-files` + `read`.',
  })
  @ApiOkResponse({ type: [FileResponseDto] })
  @ApiBadRequestResponse({ description: 'userId is not a UUID' })
  getFiles(
    @Req() request: Request & AuthenticatedRequest,
    @Query() query: ListFilesQueryDto,
  ) {
    return this.filesService.listFiles(request.user.id, query.userId);
  }

  @RequirePermission(RBAC_RESOURCES.MY_FILES, RBAC_ACTIONS.READ)
  @Get('user/:userId')
  @ApiOperation({
    summary: 'List files for a user',
    description:
      'Returns files published by `userId`, including publisher email. Callers with `files-list` + `read` (admins) may query any user; others may only query themselves. Requires permission `my-files` + `read`.',
  })
  @ApiParam({
    name: 'userId',
    format: 'uuid',
    example: '11111111-1111-1111-1111-111111111111',
    description: 'Publisher whose files should be listed.',
  })
  @ApiOkResponse({ type: [FileResponseDto] })
  @ApiBadRequestResponse({ description: 'userId is not a UUID' })
  getFilesForUser(
    @Req() request: Request & AuthenticatedRequest,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.filesService.listFiles(request.user.id, userId);
  }
}
