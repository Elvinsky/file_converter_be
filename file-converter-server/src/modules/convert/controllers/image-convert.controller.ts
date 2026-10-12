import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiProduces,
  ApiRequestTimeoutResponse,
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
  IMAGE_CONVERT_RESPONSE_CONTENT,
  ImageConvertErrorDto,
  ImageConvertFormatPairDto,
  ImageConvertUploadDto,
} from '../dto/image-convert.dto';
import { mapFastifyFileTooLarge } from '../errors/convert.errors';
import { ImageConvertService } from '../services/image-convert.service';

@ApiTags('Images')
@UseGuards(JwtAuthGuard)
@ApiCookieAuth('access_token')
@Controller('images/convert')
export class ImageConvertController {
  constructor(private readonly images: ImageConvertService) {}

  @Get('formats')
  @ApiOperation({
    summary: 'List supported image conversion pairs',
    description:
      'PNG can become JPEG, JPEG can become PNG, and SVG can become PNG or JPEG. PNG and JPEG are never converted to SVG.',
  })
  @ApiOkResponse({ type: [ImageConvertFormatPairDto] })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid',
  })
  getFormats() {
    return this.images.listFormats();
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiProduces('image/png', 'image/jpeg')
  @ApiBody({ type: ImageConvertUploadDto })
  @ApiOperation({
    summary: 'Convert an image',
    description:
      'Authenticated multipart intake. Field `file` plus `targetFormat` (`png`, `jpeg`, or `svg`). Optional `save` keeps the result in storage. Optional `quality`, `width`, `height`, and `background` (or a JSON `options` field) apply as documented on the upload body. Success is `converted.png` or `converted.jpeg`.',
  })
  @ApiOkResponse({
    description: 'Converted image attachment',
    content: IMAGE_CONVERT_RESPONSE_CONTENT,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid',
  })
  @ApiBadRequestResponse({ type: ImageConvertErrorDto })
  @ApiUnsupportedMediaTypeResponse({ type: ImageConvertErrorDto })
  @ApiPayloadTooLargeResponse({ type: ImageConvertErrorDto })
  @ApiRequestTimeoutResponse({
    description: 'CONVERSION_TIMEOUT',
    type: ImageConvertErrorDto,
  })
  async convert(
    @Req() request: Request & AuthenticatedRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const part = await mapFastifyFileTooLarge(() => request.file());
    const upload = part && part.fieldname === 'file' ? part : null;
    const result = await this.images.convert(upload, {
      userId: request.user.id,
    });

    return sendAttachment(reply, result);
  }
}
