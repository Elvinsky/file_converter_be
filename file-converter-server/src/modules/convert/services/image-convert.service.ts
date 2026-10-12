import {
  HttpException,
  Inject,
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';

import { ConfigService } from '@/core/config/config.service';
import { Config } from '@/core/config/config.types';
import { TransformationHistoryService } from '@/modules/transformations/services/transformation-history.service';

import {
  CONVERT_ERROR_CODES,
  mapFastifyFileTooLarge,
  readConvertErrorCode,
  throwConvertError,
} from '../errors/convert.errors';
import { detectImageFormat } from '../images/image-detector';
import {
  ImageSourceFormat,
  ImageTargetFormat,
  getImageFormatsCatalog,
  isImagePairAllowed,
  parseImageTargetFormat,
} from '../images/image-graph';
import { runImageConversion } from '../images/run-image-conversion';
import { ImageConversionResult } from '../images/run-image-conversion';
import { parseSaveFlag, readMultipartValue } from '../utils/multipart.util';
import { withTimeout } from '../utils/timeout.util';
import {
  CONVERSION_RUNNER,
  type ConversionRunner,
} from '../workers/conversion.constants';

import { IncomingConvertUpload } from './convert.service';

const MAX_UPLOAD_BYTES_BY_SOURCE = {
  png: 'CONVERT_MAX_UPLOAD_PNG_BYTES',
  jpeg: 'CONVERT_MAX_UPLOAD_JPEG_BYTES',
  svg: 'CONVERT_MAX_UPLOAD_SVG_BYTES',
} as const satisfies Record<ImageSourceFormat, keyof Config>;

const BACKGROUND = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

type ImageOptions = {
  quality?: number;
  width?: number;
  height?: number;
  background: string;
};

@Injectable()
export class ImageConvertService {
  private readonly logger = new Logger(ImageConvertService.name);

  constructor(
    private readonly config: ConfigService,
    @Optional()
    @Inject(CONVERSION_RUNNER)
    private readonly runner?: ConversionRunner,
    @Optional()
    private readonly history?: TransformationHistoryService,
  ) {}

  listFormats() {
    return getImageFormatsCatalog();
  }

  async convert(
    part: IncomingConvertUpload | null,
    context: { userId?: string } = {},
  ): Promise<ImageConversionResult> {
    const started = Date.now();
    const trace = {
      sourceFormat: 'unknown',
      targetFormat: 'unknown',
      fileSize: 0,
      save: false,
    };

    try {
      if (!part) {
        throwConvertError(CONVERT_ERROR_CODES.FILE_REQUIRED);
      }

      const body = await mapFastifyFileTooLarge(() => part.toBuffer());
      trace.fileSize = body.length;
      const targetToken = this.readTarget(part);
      trace.targetFormat = targetToken;
      trace.save = this.readSave(part);

      if (body.length === 0) {
        throwConvertError(CONVERT_ERROR_CODES.FILE_EMPTY);
      }

      const sourceFormat = detectImageFormat({
        filename: part.filename,
        mimeType: part.mimetype,
        body,
      });
      trace.sourceFormat = sourceFormat;

      const maxBytes = this.config.get(
        MAX_UPLOAD_BYTES_BY_SOURCE[sourceFormat],
      );

      if (body.length > maxBytes) {
        throwConvertError(CONVERT_ERROR_CODES.FILE_TOO_LARGE);
      }

      if (!isImagePairAllowed(sourceFormat, targetToken)) {
        throwConvertError(CONVERT_ERROR_CODES.PAIR_NOT_ALLOWED);
      }

      const options = this.readOptions(part.fields);
      const quality =
        options.quality ?? this.config.get('CONVERT_IMAGE_QUALITY_DEFAULT');
      const converted = await withTimeout(
        this.execute({
          body,
          source: sourceFormat,
          target: targetToken,
          width: options.width,
          height: options.height,
          quality,
          background: options.background,
          maxWidth: this.config.get('CONVERT_IMAGE_MAX_WIDTH'),
          maxHeight: this.config.get('CONVERT_IMAGE_MAX_HEIGHT'),
          maxPixels: this.config.get('CONVERT_IMAGE_MAX_PIXELS'),
        }),
        this.timeoutMs(),
      );

      await this.remember({
        userId: context.userId ?? '',
        type: 'image',
        sourceFormat,
        targetFormat: targetToken,
        status: 'success',
        fileSize: body.length,
        durationMs: Date.now() - started,
        save: trace.save,
        body: converted.body,
        contentType: converted.contentType,
        fileName: converted.fileName,
      });

      return converted;
    } catch (error) {
      await this.remember({
        userId: context.userId ?? '',
        type: 'image',
        sourceFormat: trace.sourceFormat,
        targetFormat: trace.targetFormat,
        status: 'error',
        fileSize: trace.fileSize,
        durationMs: Date.now() - started,
        errorCode: readConvertErrorCode(error),
        save: false,
      });
      throw error;
    }
  }

  private async execute(input: {
    body: Buffer;
    source: ImageSourceFormat;
    target: ImageTargetFormat;
    width?: number;
    height?: number;
    quality: number;
    background: string;
    maxWidth: number;
    maxHeight: number;
    maxPixels: number;
  }): Promise<ImageConversionResult> {
    if (this.runner) {
      return this.runner.run({ kind: 'image', ...input });
    }

    return runImageConversion(input);
  }

  private timeoutMs(): number {
    return this.config.get('CONVERT_TIMEOUT_MS');
  }

  private async remember(
    input: Parameters<TransformationHistoryService['record']>[0],
  ): Promise<void> {
    if (!this.history || !input.userId) {
      return;
    }

    try {
      await this.history.record(input);
    } catch {
      this.logger.error('Failed to record transformation history');
    }
  }

  private readTarget(part: IncomingConvertUpload): ImageTargetFormat {
    const raw = readMultipartValue(part.fields, 'targetFormat');
    const parsed =
      typeof raw === 'string' ? parseImageTargetFormat(raw) : undefined;

    if (!parsed) {
      throwConvertError(CONVERT_ERROR_CODES.INVALID_TARGET_FORMAT);
    }

    return parsed;
  }

  private readSave(part: IncomingConvertUpload): boolean {
    const save = parseSaveFlag(readMultipartValue(part.fields, 'save'));

    if (save === undefined) {
      throwConvertError(CONVERT_ERROR_CODES.INVALID_SAVE);
    }

    return save;
  }

  private readOptions(
    fields: Record<string, unknown> | undefined,
  ): ImageOptions {
    const parsed = parseOptionsObject(readMultipartValue(fields, 'options'));
    const maxWidth = this.limit('CONVERT_IMAGE_MAX_WIDTH');
    const maxHeight = this.limit('CONVERT_IMAGE_MAX_HEIGHT');
    const quality = readOptionalInt(
      firstDefined(readMultipartValue(fields, 'quality'), parsed.quality),
      'quality',
    );
    const width = readOptionalInt(
      firstDefined(readMultipartValue(fields, 'width'), parsed.width),
      'width',
    );
    const height = readOptionalInt(
      firstDefined(readMultipartValue(fields, 'height'), parsed.height),
      'height',
    );
    const background = String(
      firstDefined(
        readMultipartValue(fields, 'background'),
        parsed.background,
        '#ffffff',
      ),
    );

    if (quality !== undefined && (quality < 1 || quality > 100)) {
      throwConvertError(
        CONVERT_ERROR_CODES.INVALID_OPTIONS,
        'quality must be an integer from 1 to 100',
      );
    }

    if (!BACKGROUND.test(background)) {
      throwConvertError(
        CONVERT_ERROR_CODES.INVALID_OPTIONS,
        'background must be a hex color',
      );
    }

    if (width !== undefined && (width < 1 || width > maxWidth)) {
      throwConvertError(CONVERT_ERROR_CODES.LIMIT_IMAGE_DIMENSION);
    }

    if (height !== undefined && (height < 1 || height > maxHeight)) {
      throwConvertError(CONVERT_ERROR_CODES.LIMIT_IMAGE_DIMENSION);
    }

    return { quality, width, height, background };
  }

  private limit(key: 'CONVERT_IMAGE_MAX_WIDTH' | 'CONVERT_IMAGE_MAX_HEIGHT') {
    const value = this.config.get(key);

    return typeof value === 'number' && value > 0 ? value : 8192;
  }
}

function parseOptionsObject(raw: unknown): Record<string, unknown> {
  if (raw === undefined || raw === '') {
    return {};
  }

  if (typeof raw !== 'string') {
    throwConvertError(CONVERT_ERROR_CODES.INVALID_OPTIONS);
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throwConvertError(CONVERT_ERROR_CODES.INVALID_OPTIONS);
    }

    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }

    throwConvertError(CONVERT_ERROR_CODES.INVALID_OPTIONS);
  }
}

function readOptionalInt(raw: unknown, field: string): number | undefined {
  if (raw === undefined || raw === '') {
    return undefined;
  }

  if (typeof raw === 'number' && Number.isInteger(raw)) {
    return raw;
  }

  if (typeof raw === 'string' && /^[0-9]+$/.test(raw)) {
    return Number(raw);
  }

  throwConvertError(
    CONVERT_ERROR_CODES.INVALID_OPTIONS,
    `${field} must be an integer`,
  );
}

function firstDefined(...values: unknown[]): unknown {
  return values.find((value) => value !== undefined && value !== '');
}
