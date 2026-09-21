import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnsupportedMediaTypeResponse,
} from '@nestjs/swagger';
import '@fastify/multipart';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '@/modules/auth/types/authenticated-request';

import { TextConvertUploadDto } from '../dto/text-convert.dto';
import {
  CONVERT_ERROR_CODES,
  throwConvertError,
} from '../errors/convert.errors';
import { ConvertService } from '../services/convert.service';

@ApiTags('Convert')
@Controller('convert')
export class ConvertController {
  constructor(private readonly convertService: ConvertService) {}

  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('access_token')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: TextConvertUploadDto })
  @ApiOperation({
    summary: 'Accept a file for conversion',
    description:
      'Authenticated multipart intake. Field `file` plus `targetFormat` (csv, json, xml, yaml). Returns a JSON stub; conversion is not performed.',
  })
  @ApiOkResponse({
    description: 'File was accepted; conversion has not run',
    schema: {
      example: {
        accepted: true,
        sourceFormat: 'csv',
        targetFormat: 'json',
        bytes: 12,
        originalName: 'data.csv',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid',
  })
  @ApiBadRequestResponse({
    description:
      'File is missing, empty, targetFormat is invalid, or the conversion pair is not allowed',
  })
  @ApiUnsupportedMediaTypeResponse({
    description:
      'Source format is unknown or conflicts across filename, MIME, and content',
  })
  @Post()
  async convert(@Req() request: Request & AuthenticatedRequest) {
    const part = await request.file();

    if (!part || part.fieldname !== 'file') {
      throwConvertError(CONVERT_ERROR_CODES.FILE_REQUIRED);
    }

    return this.convertService.convert(part);
  }
}
