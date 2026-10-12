import { Inject, Injectable, Logger, Optional } from '@nestjs/common';

import { ConfigService } from '@/core/config/config.service';
import { Config } from '@/core/config/config.types';
import { TransformationHistoryService } from '@/modules/transformations/services/transformation-history.service';

import { runTextConversion } from '../codecs/text-codecs';
import { TargetFormat, TextConvertResultDto } from '../dto/text-convert.dto';
import {
  CONVERT_ERROR_CODES,
  mapFastifyFileTooLarge,
  readConvertErrorCode,
  throwConvertError,
} from '../errors/convert.errors';
import { decodeUtf8, stripUtf8Bom } from '../utils/utf8.util';
import { parseSaveFlag, readMultipartValue } from '../utils/multipart.util';
import { withTimeout } from '../utils/timeout.util';
import { ConversionJob } from '../workers/conversion-job';
import {
  CONVERSION_RUNNER,
  type ConversionRunner,
} from '../workers/conversion.constants';
import {
  ConvertFormat,
  getFormatsCatalog,
  isPairAllowed,
  toConvertFormat,
} from './conversion-graph';
import { FormatDetectorService } from './format-detector.service';

const MAX_UPLOAD_BYTES_BY_SOURCE = {
  [TargetFormat.CSV]: 'CONVERT_MAX_UPLOAD_CSV_BYTES',
  [TargetFormat.JSON]: 'CONVERT_MAX_UPLOAD_JSON_BYTES',
  [TargetFormat.XML]: 'CONVERT_MAX_UPLOAD_XML_BYTES',
  [TargetFormat.YAML]: 'CONVERT_MAX_UPLOAD_YAML_BYTES',
} as const satisfies Record<ConvertFormat, keyof Config>;

export type IncomingConvertUpload = {
  filename: string;
  mimetype: string;
  toBuffer: () => Promise<Buffer>;
  fields?: Record<string, unknown>;
};

export type ConvertContext = {
  userId?: string;
};

export type ConvertAcceptedStub = {
  accepted: true;
  sourceFormat: TargetFormat;
  targetFormat: TargetFormat;
  bytes: number;
  originalName: string;
};

export type ConvertOutcome = ConvertAcceptedStub | TextConvertResultDto;

export function isConvertedFile(
  result: ConvertOutcome,
): result is TextConvertResultDto {
  return 'body' in result;
}

@Injectable()
export class ConvertService {
  private readonly logger = new Logger(ConvertService.name);

  constructor(
    private readonly formatDetector: FormatDetectorService,
    private readonly config: ConfigService,
    @Optional()
    @Inject(CONVERSION_RUNNER)
    private readonly runner?: ConversionRunner,
    @Optional()
    private readonly history?: TransformationHistoryService,
  ) {}

  listFormats() {
    return getFormatsCatalog();
  }

  async convert(
    part: IncomingConvertUpload | null,
    context: ConvertContext = {},
  ): Promise<ConvertOutcome> {
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
      const targetFormat = this.readTargetFormat(part);
      trace.targetFormat = targetFormat;
      trace.save = this.readSave(part);

      if (body.length === 0) {
        throwConvertError(CONVERT_ERROR_CODES.FILE_EMPTY);
      }

      const textBytes = stripUtf8Bom(body);

      if (textBytes.length === 0) {
        throwConvertError(CONVERT_ERROR_CODES.FILE_EMPTY);
      }

      const text = decodeUtf8(textBytes);
      const sourceFormat = this.formatDetector.detect({
        filename: part.filename,
        mimeType: part.mimetype,
        body: textBytes,
      });
      trace.sourceFormat = sourceFormat;

      const maxBytes = this.config.get(
        MAX_UPLOAD_BYTES_BY_SOURCE[sourceFormat],
      );

      if (body.length > maxBytes) {
        throwConvertError(CONVERT_ERROR_CODES.FILE_TOO_LARGE);
      }

      if (!isPairAllowed(sourceFormat, targetFormat)) {
        throwConvertError(CONVERT_ERROR_CODES.PAIR_NOT_ALLOWED);
      }

      const converted = await withTimeout(
        this.execute({
          kind: 'text',
          text,
          source: sourceFormat,
          target: targetFormat,
          limits: {
            maxCsvRows: this.config.get('CONVERT_MAX_CSV_ROWS'),
            maxDepth: this.config.get('CONVERT_MAX_DEPTH'),
            maxKeys: this.config.get('CONVERT_MAX_KEYS'),
            maxYamlAliases: this.config.get('CONVERT_YAML_MAX_ALIASES'),
          },
        }),
        this.timeoutMs(),
      );

      if (!converted) {
        throwConvertError(CONVERT_ERROR_CODES.CONVERT_INTERNAL);
      }

      await this.remember({
        userId: context.userId ?? '',
        type: 'file',
        sourceFormat,
        targetFormat,
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
        type: 'file',
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

  private async execute(
    job: ConversionJob,
  ): Promise<TextConvertResultDto | undefined> {
    if (this.runner) {
      return this.runner.run(job);
    }

    if (job.kind !== 'text') {
      throwConvertError(CONVERT_ERROR_CODES.CONVERT_INTERNAL);
    }

    return runTextConversion(
      job.text,
      job.source as TargetFormat,
      job.target as TargetFormat,
      job.limits,
    );
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

  private readTargetFormat(part: IncomingConvertUpload): TargetFormat {
    const raw = readMultipartValue(part.fields, 'targetFormat');
    const parsed =
      typeof raw === 'string'
        ? toConvertFormat(raw.trim().toLowerCase())
        : undefined;

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
}
