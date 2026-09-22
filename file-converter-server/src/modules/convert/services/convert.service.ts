import { Injectable } from '@nestjs/common';

import { ConfigService } from '@/core/config/config.service';
import { Config } from '@/core/config/config.types';

import { TargetFormat } from '../dto/text-convert.dto';
import {
  CONVERT_ERROR_CODES,
  mapFastifyFileTooLarge,
  throwConvertError,
} from '../errors/convert.errors';
import { decodeUtf8, stripUtf8Bom } from '../utils/utf8.util';
import {
  ConvertFormat,
  getFormatsCatalog,
  isPairAllowed,
  toConvertFormat,
} from './conversion-graph';
import { FormatDetectorService } from './format-detector.service';

const MAX_UPLOAD_BYTES_BY_SOURCE: Record<ConvertFormat, keyof Config> = {
  [TargetFormat.CSV]: 'CONVERT_MAX_UPLOAD_CSV_BYTES',
  [TargetFormat.JSON]: 'CONVERT_MAX_UPLOAD_JSON_BYTES',
  [TargetFormat.XML]: 'CONVERT_MAX_UPLOAD_XML_BYTES',
  [TargetFormat.YAML]: 'CONVERT_MAX_UPLOAD_YAML_BYTES',
};

export type IncomingConvertUpload = {
  filename: string;
  mimetype: string;
  toBuffer: () => Promise<Buffer>;
  fields?: Record<string, unknown>;
};

export type ConvertAcceptedStub = {
  accepted: true;
  sourceFormat: TargetFormat;
  targetFormat: TargetFormat;
  bytes: number;
  originalName: string;
};

@Injectable()
export class ConvertService {
  constructor(
    private readonly formatDetector: FormatDetectorService,
    private readonly config: ConfigService,
  ) {}

  listFormats() {
    return getFormatsCatalog();
  }

  async convert(part: IncomingConvertUpload): Promise<ConvertAcceptedStub> {
    const targetFormat = this.readTargetFormat(part);
    const body = await mapFastifyFileTooLarge(() => part.toBuffer());

    if (body.length === 0) {
      throwConvertError(CONVERT_ERROR_CODES.FILE_EMPTY);
    }

    const textBytes = stripUtf8Bom(body);

    if (textBytes.length === 0) {
      throwConvertError(CONVERT_ERROR_CODES.FILE_EMPTY);
    }

    decodeUtf8(textBytes);

    const sourceFormat = this.formatDetector.detect({
      filename: part.filename,
      mimeType: part.mimetype,
      body: textBytes,
    });

    const maxBytes = this.config.get(MAX_UPLOAD_BYTES_BY_SOURCE[sourceFormat]);

    if (body.length > maxBytes) {
      throwConvertError(CONVERT_ERROR_CODES.FILE_TOO_LARGE);
    }

    if (!isPairAllowed(sourceFormat, targetFormat)) {
      throwConvertError(CONVERT_ERROR_CODES.PAIR_NOT_ALLOWED);
    }

    return {
      accepted: true,
      sourceFormat,
      targetFormat,
      bytes: body.length,
      originalName: part.filename,
    };
  }

  private readTargetFormat(part: IncomingConvertUpload): TargetFormat {
    const raw = this.readMultipartValue(part.fields?.targetFormat);
    const parsed = typeof raw === 'string' ? toConvertFormat(raw) : undefined;

    if (!parsed) {
      throwConvertError(CONVERT_ERROR_CODES.INVALID_TARGET_FORMAT);
    }

    return parsed;
  }

  private readMultipartValue(field: unknown): unknown {
    const sibling = Array.isArray(field) ? (field as unknown[])[0] : field;

    if (
      typeof sibling !== 'object' ||
      sibling === null ||
      !('value' in sibling)
    ) {
      return undefined;
    }

    return sibling.value;
  }
}
