import { Injectable } from '@nestjs/common';
import path from 'node:path';

import { TargetFormat } from '../dto/text-convert.dto';
import {
  CONVERT_ERROR_CODES,
  throwConvertError,
} from '../errors/convert.errors';
import { stripUtf8Bom } from '../utils/utf8.util';
import { type ConvertFormat } from './conversion-graph';

const SNIFF_LIMIT = 4 * 1024;

const MIME_TO_FORMAT: Record<string, ConvertFormat> = {
  'application/json': TargetFormat.JSON,
  'text/json': TargetFormat.JSON,
  'application/xml': TargetFormat.XML,
  'text/xml': TargetFormat.XML,
  'application/yaml': TargetFormat.YAML,
  'text/yaml': TargetFormat.YAML,
  'application/x-yaml': TargetFormat.YAML,
  'text/csv': TargetFormat.CSV,
  'application/csv': TargetFormat.CSV,
};

type Sniff =
  | { kind: 'format'; format: ConvertFormat; weak?: boolean }
  | { kind: 'uncertain' };

export type DetectSourceInput = {
  filename: string;
  mimeType: string;
  body: Buffer;
};

@Injectable()
export class FormatDetectorService {
  detect({ filename, mimeType, body }: DetectSourceInput): ConvertFormat {
    const ext = this.fromExtension(filename);
    const mime = this.fromMime(mimeType);
    const sniff = this.fromSniff(body);

    if (ext && mime) {
      if (ext !== mime) {
        throwConvertError(CONVERT_ERROR_CODES.FORMAT_CONFLICT);
      }
      if (this.sniffConflicts(sniff, ext)) {
        throwConvertError(CONVERT_ERROR_CODES.FORMAT_CONFLICT);
      }
      return ext;
    }

    const candidate = ext ?? mime;
    if (candidate) {
      if (this.sniffConflicts(sniff, candidate)) {
        throwConvertError(CONVERT_ERROR_CODES.FORMAT_CONFLICT);
      }
      return candidate;
    }

    if (
      sniff.kind === 'format' &&
      !(sniff.format === TargetFormat.YAML && sniff.weak)
    ) {
      return sniff.format;
    }

    throwConvertError(CONVERT_ERROR_CODES.UNSUPPORTED_SOURCE_FORMAT);
  }

  private fromExtension(filename: string): ConvertFormat | undefined {
    const ext = path.extname(filename).toLowerCase();

    if (ext === '.json') {
      return TargetFormat.JSON;
    }
    if (ext === '.csv') {
      return TargetFormat.CSV;
    }
    if (ext === '.xml') {
      return TargetFormat.XML;
    }
    if (ext === '.yaml' || ext === '.yml') {
      return TargetFormat.YAML;
    }

    return undefined;
  }

  private fromMime(mimeType: string): ConvertFormat | undefined {
    const normalized = mimeType.split(';')[0]?.trim().toLowerCase();

    if (
      !normalized ||
      normalized === 'application/octet-stream' ||
      normalized === 'multipart/form-data'
    ) {
      return undefined;
    }

    return MIME_TO_FORMAT[normalized];
  }

  private fromSniff(body: Buffer): Sniff {
    const sliced = body.subarray(0, SNIFF_LIMIT);
    const withoutBom = stripUtf8Bom(sliced);
    const trimmed = withoutBom.toString('utf8').trim();

    if (!trimmed) {
      return { kind: 'uncertain' };
    }
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return { kind: 'format', format: TargetFormat.JSON };
    }
    if (trimmed.startsWith('<')) {
      return { kind: 'format', format: TargetFormat.XML };
    }
    if (trimmed.startsWith('---')) {
      return { kind: 'format', format: TargetFormat.YAML };
    }
    if (this.looksLikeCsv(trimmed)) {
      return { kind: 'format', format: TargetFormat.CSV };
    }
    if (this.looksLikeYamlKeyLine(trimmed)) {
      return { kind: 'format', format: TargetFormat.YAML, weak: true };
    }

    return { kind: 'uncertain' };
  }

  private sniffConflicts(sniff: Sniff, candidate: ConvertFormat): boolean {
    if (sniff.kind !== 'format') {
      return false;
    }
    if (sniff.weak && sniff.format === TargetFormat.YAML) {
      return false;
    }
    return sniff.format !== candidate;
  }

  private looksLikeCsv(trimmed: string): boolean {
    const firstLine = trimmed.split(/\r?\n/, 1)[0] ?? '';
    if (!firstLine.includes(',')) {
      return false;
    }

    const fields = firstLine.split(',').map((field) => field.trim());
    const headerLike =
      fields.length >= 2 &&
      fields.every(
        (field) =>
          field.length > 0 &&
          !field.includes(':') &&
          !field.startsWith('{') &&
          !field.startsWith('<'),
      );

    return headerLike || /\r?\n/.test(trimmed);
  }

  private looksLikeYamlKeyLine(trimmed: string): boolean {
    const firstLine = trimmed.split(/\r?\n/, 1)[0] ?? '';
    return /^[A-Za-z_][\w.-]*\s*:\s*\S/.test(firstLine);
  }
}
