import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnsupportedMediaTypeResponse,
} from '@nestjs/swagger';
import '@fastify/multipart';
import type { FastifyReply } from 'fastify';

import { sendAttachment } from '@/core/http/http.utils';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '@/modules/auth/types/authenticated-request';

import {
  TextConvertFormatPairDto,
  TextConvertUploadDto,
} from '../dto/text-convert.dto';
import {
  CONVERT_ERROR_CODES,
  mapFastifyFileTooLarge,
  throwConvertError,
} from '../errors/convert.errors';
import { ConvertService, isConvertedFile } from '../services/convert.service';

@ApiTags('Convert')
@UseGuards(JwtAuthGuard)
@ApiCookieAuth('access_token')
@Controller('convert')
export class ConvertController {
  constructor(private readonly convertService: ConvertService) {}

  @Get('formats')
  @ApiOperation({
    summary: 'List supported conversion pairs',
    description:
      'Returns allowed directions as `{ source, target[] }`. Twelve pairs in total: each of csv, json, xml, yaml to the other three.',
  })
  @ApiOkResponse({
    description: 'Allowed conversion pairs',
    type: [TextConvertFormatPairDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid',
  })
  getFormats() {
    return this.convertService.listFormats();
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: TextConvertUploadDto })
  @ApiOperation({
    summary: 'Accept a file for conversion',
    description:
      'Authenticated multipart intake. Field `file` plus `targetFormat`. A pair is converted when its source parse, IR adapter, and target serialize are registered; otherwise a JSON stub is returned.',
  })
  @ApiOkResponse({
    description:
      'CSV↔JSON attachments when those codecs are registered. Other pairs: acceptance stub.',
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid',
  })
  @ApiBadRequestResponse({
    description:
      'File is missing, empty, not UTF-8, targetFormat is invalid, or the conversion pair is not allowed',
  })
  @ApiUnsupportedMediaTypeResponse({
    description:
      'Source format is unknown or conflicts across filename, MIME, and content',
  })
  @ApiPayloadTooLargeResponse({
    description:
      'File exceeds MULTIPART_MAX_FILE_BYTES or CONVERT_MAX_UPLOAD_<source>_BYTES',
  })
  async convert(
    @Req() request: Request & AuthenticatedRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const part = await mapFastifyFileTooLarge(() => request.file());

    if (!part || part.fieldname !== 'file') {
      throwConvertError(CONVERT_ERROR_CODES.FILE_REQUIRED);
    }

    const result = await this.convertService.convert(part);

    if (!isConvertedFile(result)) {
      return result;
    }

    return sendAttachment(reply, result);
  }
}
