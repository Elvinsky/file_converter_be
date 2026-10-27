import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { copyFile, rm } from 'node:fs/promises';
import type { Readable } from 'node:stream';

import { ConfigService } from '@/core/config/config.service';
import { Config } from '@/core/config/config.types';
import { TransformationHistoryService } from '@/modules/transformations/services/transformation-history.service';

import { convertTextFile } from '../codecs/convert-text-file';
import { TargetFormat } from '../dto/text-convert.dto';
import {
  CONVERT_ERROR_CODES,
  mapFastifyFileTooLarge,
  readConvertErrorCode,
  throwConvertError,
} from '../errors/convert.errors';
import { stripUtf8Bom } from '../utils/utf8.util';
import { parseSaveFlag, readMultipartValue } from '../utils/multipart.util';
import { readFilePrefix, spoolStream } from '../utils/spool.util';
import { withTimeout } from '../utils/timeout.util';
import { ConvertedFile, ConversionJob } from '../workers/conversion-job';
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

const SNIFF_PREFIX_BYTES = 4 * 1024;

export type IncomingConvertUpload = {
  filename: string;
  mimetype: string;
  file: Readable;
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

export type ConvertOutcome = ConvertAcceptedStub | ConvertedFile;

export function isConvertedFile(
  result: ConvertOutcome,
): result is ConvertedFile {
  return 'outputPath' in result;
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

    let sourcePath: string | undefined;
    let outputPath: string | undefined;

    try {
      if (!part) {
        throwConvertError(CONVERT_ERROR_CODES.FILE_REQUIRED);
      }

      const spooled = await mapFastifyFileTooLarge(() =>
        spoolStream(part.file),
      );
      sourcePath = spooled.path;
      trace.fileSize = spooled.size;
      const targetFormat = this.readTargetFormat(part);
      trace.targetFormat = targetFormat;
      trace.save = this.readSave(part);

      if (
        spooled.size === 0 ||
        isBomOnly(await readFilePrefix(sourcePath, 3), spooled.size)
      ) {
        throwConvertError(CONVERT_ERROR_CODES.FILE_EMPTY);
      }

      const prefix = await readFilePrefix(sourcePath, SNIFF_PREFIX_BYTES);
      const sourceFormat = this.formatDetector.detect({
        filename: part.filename,
        mimeType: part.mimetype,
        body: prefix,
      });
      trace.sourceFormat = sourceFormat;

      const maxBytes = this.config.get(
        MAX_UPLOAD_BYTES_BY_SOURCE[sourceFormat],
      );

      if (spooled.size > maxBytes) {
        throwConvertError(CONVERT_ERROR_CODES.FILE_TOO_LARGE);
      }

      if (!isPairAllowed(sourceFormat, targetFormat)) {
        throwConvertError(CONVERT_ERROR_CODES.PAIR_NOT_ALLOWED);
      }

      const converted = await withTimeout(
        this.execute({
          kind: 'text',
          sourcePath,
          source: sourceFormat,
          target: targetFormat,
          limits: {
            maxCsvRows: this.config.get('CONVERT_MAX_CSV_ROWS'),
            maxDepth: this.config.get('CONVERT_MAX_DEPTH'),
            maxKeys: this.config.get('CONVERT_MAX_KEYS'),
            maxNodes: this.config.get('CONVERT_MAX_NODES'),
            maxYamlAliases: this.config.get('CONVERT_YAML_MAX_ALIASES'),
          },
        }),
        this.timeoutMs(),
      );

      if (!converted) {
        throwConvertError(CONVERT_ERROR_CODES.CONVERT_INTERNAL);
      }

      outputPath = converted.outputPath;
      const savePath = trace.save ? `${converted.outputPath}.save` : undefined;

      if (savePath) {
        await copyFile(converted.outputPath, savePath);
      }

      await this.remember({
        userId: context.userId ?? '',
        type: 'file',
        sourceFormat,
        targetFormat,
        status: 'success',
        fileSize: spooled.size,
        durationMs: Date.now() - started,
        save: trace.save,
        bodyPath: savePath,
        storedBytes: converted.size,
        contentType: converted.contentType,
        fileName: converted.fileName,
      });

      outputPath = undefined;

      return converted;
    } catch (error) {
      if (outputPath) {
        await rm(outputPath, { force: true });
      }

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
    } finally {
      if (sourcePath) {
        await rm(sourcePath, { force: true });
      }
    }
  }

  private async execute(
    job: ConversionJob,
  ): Promise<ConvertedFile | undefined> {
    if (this.runner) {
      return this.runner.run(job);
    }

    if (job.kind !== 'text') {
      throwConvertError(CONVERT_ERROR_CODES.CONVERT_INTERNAL);
    }

    return convertTextFile(
      job.sourcePath,
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
      if (input.bodyPath) {
        await rm(input.bodyPath, { force: true });
      }

      return;
    }

    try {
      await this.history.record(input);
    } catch {
      if (input.bodyPath) {
        await rm(input.bodyPath, { force: true });
      }

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

function isBomOnly(prefix: Buffer, size: number): boolean {
  if (size < 1 || size > 3) {
    return false;
  }

  return stripUtf8Bom(prefix.subarray(0, size)).length === 0;
}
