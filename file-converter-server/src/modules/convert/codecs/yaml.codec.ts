import yaml from 'js-yaml';

import {
  CONVERT_ERROR_CODES,
  throwConvertError,
} from '../errors/convert.errors';
import { JsonValue, ValueIr } from '../ir/canonical.types';
import { ParseJsonOptions, sanitizeJsonValue } from './json.codec';

export type ParseYamlOptions = ParseJsonOptions & {
  maxAliases?: number;
};

export function parseYaml(
  text: string,
  options: ParseYamlOptions = {},
): ValueIr {
  let parsed: unknown;

  try {
    parsed = yaml.load(text, {
      schema: yaml.CORE_SCHEMA,
      maxAliases: options.maxAliases ?? 100,
    });
  } catch {
    throwConvertError(CONVERT_ERROR_CODES.INVALID_SYNTAX);
  }

  if (parsed === undefined) {
    throwConvertError(CONVERT_ERROR_CODES.INVALID_SYNTAX);
  }

  const stats = { keys: 0, nodes: 0 };
  const value = sanitizeJsonValue(toJsonValue(parsed), 0, options, stats);

  return { kind: 'value', value };
}

export function serializeYaml(value: JsonValue): Buffer {
  try {
    const dumped = yaml.dump(value, {
      schema: yaml.CORE_SCHEMA,
      noRefs: true,
      lineWidth: 120,
    });

    return Buffer.from(dumped, 'utf8');
  } catch {
    throwConvertError(CONVERT_ERROR_CODES.INVALID_SYNTAX);
  }
}

function toJsonValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}
