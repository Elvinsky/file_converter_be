import { Injectable } from '@nestjs/common';

import { TargetFormat } from '../dto/text-convert.dto';
import {
  CONVERT_ERROR_CODES,
  throwConvertError,
} from '../errors/convert.errors';
import { isPairAllowed, toConvertFormat } from './conversion-graph';
import { FormatDetectorService } from './format-detector.service';

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
  constructor(private readonly formatDetector: FormatDetectorService) {}

  async convert(part: IncomingConvertUpload): Promise<ConvertAcceptedStub> {
    const targetFormat = this.readTargetFormat(part);
    const body = await part.toBuffer();

    if (body.length === 0) {
      throwConvertError(CONVERT_ERROR_CODES.FILE_EMPTY);
    }

    const sourceFormat = this.formatDetector.detect({
      filename: part.filename,
      mimeType: part.mimetype,
      body,
    });

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
