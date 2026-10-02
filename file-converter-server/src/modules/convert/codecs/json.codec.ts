import {
  CONVERT_ERROR_CODES,
  throwConvertError,
} from '../errors/convert.errors';
import { JsonValue, ValueIr } from '../ir/canonical.types';

const POLLUTION_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

export type ParseJsonOptions = {
  maxDepth?: number;
  maxKeys?: number;
};

export function parseJson(
  text: string,
  options: ParseJsonOptions = {},
): ValueIr {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throwConvertError(CONVERT_ERROR_CODES.INVALID_SYNTAX);
  }

  const stats = { keys: 0 };
  const value = sanitizeJsonValue(parsed, 0, options, stats);

  return { kind: 'value', value };
}

export function serializeJson(value: JsonValue): Buffer {
  return Buffer.from(JSON.stringify(value), 'utf8');
}

export function sanitizeJsonValue(
  value: unknown,
  depth: number,
  options: ParseJsonOptions,
  stats: { keys: number },
): JsonValue {
  if (options.maxDepth !== undefined && depth > options.maxDepth) {
    throwConvertError(CONVERT_ERROR_CODES.LIMIT_DEPTH);
  }

  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) =>
      sanitizeJsonValue(item, depth + 1, options, stats),
    );
  }

  if (typeof value === 'object') {
    const object: { [key: string]: JsonValue } = {};

    for (const [key, nested] of Object.entries(value)) {
      if (POLLUTION_KEYS.has(key)) {
        continue;
      }

      stats.keys += 1;
      if (options.maxKeys !== undefined && stats.keys > options.maxKeys) {
        throwConvertError(CONVERT_ERROR_CODES.LIMIT_KEYS);
      }

      object[key] = sanitizeJsonValue(nested, depth + 1, options, stats);
    }

    return object;
  }

  throwConvertError(CONVERT_ERROR_CODES.INVALID_SYNTAX);
}
