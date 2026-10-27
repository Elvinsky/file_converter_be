import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiProduces,
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
  TEXT_CONVERT_RESPONSE_CONTENT,
  TextConvertErrorDto,
  TextConvertFormatPairDto,
  TextConvertUploadDto,
} from '../dto/text-convert.dto';
import { mapFastifyFileTooLarge } from '../errors/convert.errors';
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
  @ApiProduces(
    'text/csv; charset=utf-8',
    'application/json; charset=utf-8',
    'application/xml; charset=utf-8',
    'application/yaml; charset=utf-8',
  )
  @ApiBody({ type: TextConvertUploadDto })
  @ApiOperation({
    summary: 'Convert a text file',
    description:
      'Authenticated multipart intake. Field `file` plus `targetFormat` (csv, json, xml, yaml). Optional `save=true` stores the result without delaying this download. CSV is a header table of text cells. Nested values become dotted CSV columns; a list of plain values becomes a `value` column; an empty list or a single plain value cannot become CSV. XML attributes are kept as `@_name`, text as `#text`, output is wrapped in `<root>`, and lists become repeated `<item>` elements. Every allowed pair returns `converted.<ext>`. Errors use `{ code, message }`.',
  })
  @ApiOkResponse({
    description:
      'Converted attachment. Filename is `converted.csv`, `converted.json`, `converted.xml`, or `converted.yaml`.',
    content: TEXT_CONVERT_RESPONSE_CONTENT,
    headers: {
      'Content-Disposition': {
        description: 'attachment; filename="converted.<ext>"',
        schema: { type: 'string' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid',
  })
  @ApiBadRequestResponse({
    description:
      'FILE_REQUIRED, FILE_EMPTY, INVALID_TARGET_FORMAT, PAIR_NOT_ALLOWED, INVALID_ENCODING, INVALID_SYNTAX, CONVERSION_AMBIGUOUS, INVALID_SAVE, LIMIT_DEPTH, LIMIT_KEYS, LIMIT_NODES, or LIMIT_ROWS',
    type: TextConvertErrorDto,
  })
  @ApiUnsupportedMediaTypeResponse({
    description: 'UNSUPPORTED_SOURCE_FORMAT or FORMAT_CONFLICT',
    type: TextConvertErrorDto,
  })
  @ApiPayloadTooLargeResponse({
    description:
      'FILE_TOO_LARGE. File exceeds MULTIPART_MAX_FILE_BYTES or CONVERT_MAX_UPLOAD_<source>_BYTES',
    type: TextConvertErrorDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'CONVERT_INTERNAL',
    type: TextConvertErrorDto,
  })
  async convert(
    @Req() request: Request & AuthenticatedRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const part = await mapFastifyFileTooLarge(() => request.file());
    const upload = part && part.fieldname === 'file' ? part : null;
    const result = await this.convertService.convert(upload, {
      userId: request.user.id,
    });

    if (!isConvertedFile(result)) {
      return result;
    }

    return sendAttachment(reply, result);
  }
}
