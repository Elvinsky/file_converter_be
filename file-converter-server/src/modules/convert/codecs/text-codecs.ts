import {
  TargetFormat,
  TEXT_FORMAT_OUTPUT,
  TextConvertResultDto,
} from '../dto/text-convert.dto';
import {
  CONVERT_ERROR_CODES,
  throwConvertError,
} from '../errors/convert.errors';
import { adaptToTarget, asRecordsIr, asValueIr } from '../ir/adapters';
import { CanonicalIr } from '../ir/canonical.types';
import { parseCsv, serializeCsv } from './csv.codec';
import { parseJson, serializeJson } from './json.codec';

export type TextCodecLimits = {
  maxCsvRows?: number;
  maxDepth?: number;
  maxKeys?: number;
};

export type TextCodec = {
  parse?: (text: string, limits: TextCodecLimits) => CanonicalIr;
  serialize?: (ir: CanonicalIr, limits: TextCodecLimits) => Buffer;
};

/**
 * One entry per format. A pair works when source.parse, target.serialize,
 * and an IR adapter (if kinds differ) all exist. No per-pair functions.
 */
export const TEXT_CODECS: Record<TargetFormat, TextCodec> = {
  [TargetFormat.CSV]: {
    parse: (text, limits) => parseCsv(text, { maxRows: limits.maxCsvRows }),
    serialize: (ir, limits) => {
      const recordsIr = asRecordsIr(ir);

      if (!recordsIr) {
        throwConvertError(CONVERT_ERROR_CODES.CONVERT_INTERNAL);
      }

      return serializeCsv(recordsIr.records, { maxRows: limits.maxCsvRows });
    },
  },
  [TargetFormat.JSON]: {
    parse: (text, limits) =>
      parseJson(text, { maxDepth: limits.maxDepth, maxKeys: limits.maxKeys }),
    serialize: (ir) => {
      const valueIr = asValueIr(ir);

      if (!valueIr) {
        throwConvertError(CONVERT_ERROR_CODES.CONVERT_INTERNAL);
      }

      return serializeJson(valueIr.value);
    },
  },
  [TargetFormat.XML]: {},
  [TargetFormat.YAML]: {},
};

export function runTextConversion(
  text: string,
  source: TargetFormat,
  target: TargetFormat,
  limits: TextCodecLimits = {},
): TextConvertResultDto | undefined {
  const parsed = TEXT_CODECS[source].parse?.(text, limits);

  if (!parsed) {
    return undefined;
  }

  const adapted = adaptToTarget(parsed, target);

  if (!adapted) {
    return undefined;
  }

  const body = TEXT_CODECS[target].serialize?.(adapted, limits);

  if (!body) {
    return undefined;
  }

  return {
    body,
    ...TEXT_FORMAT_OUTPUT[target],
  };
}
