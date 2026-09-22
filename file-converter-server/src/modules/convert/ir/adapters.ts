import { TargetFormat } from '../dto/text-convert.dto';
import {
  CONVERT_ERROR_CODES,
  throwConvertError,
} from '../errors/convert.errors';
import {
  CanonicalIr,
  JsonObject,
  JsonValue,
  Records,
  RecordsIr,
  Scalar,
  ValueIr,
} from './canonical.types';

export type TextIrKind = 'records' | 'value';

/** What IR shape each output format expects. */
export const TARGET_IR_KIND: Record<TargetFormat, TextIrKind> = {
  [TargetFormat.CSV]: 'records',
  [TargetFormat.JSON]: 'value',
  [TargetFormat.XML]: 'value',
  [TargetFormat.YAML]: 'value',
};

type KindAdapter = (ir: CanonicalIr) => CanonicalIr | undefined;

const KIND_ADAPTERS: Record<string, KindAdapter> = {
  'records->value': (ir) => {
    if (ir.kind !== 'records') {
      return undefined;
    }

    return { kind: 'value', value: recordsToValue(ir.records) };
  },
  'value->records': (ir) => {
    if (ir.kind !== 'value') {
      return undefined;
    }

    return { kind: 'records', records: valueToRecords(ir.value) };
  },
};

/** CSV records → JSON array of objects. Header order is preserved. */
export function recordsToValue(records: Records): JsonValue {
  return records.rows.map((row) => {
    const object: JsonObject = {};

    for (const header of records.headers) {
      object[header] = row[header] ?? '';
    }

    return object;
  });
}

function isScalar(value: JsonValue): value is Scalar {
  return value === null || typeof value !== 'object';
}

function scalarToCell(value: Scalar): string {
  return value === null ? '' : String(value);
}

function flattenToRow(
  value: JsonValue,
  prefix: string,
  out: Record<string, string>,
) {
  if (isScalar(value)) {
    out[prefix || 'value'] = scalarToCell(value);
    return;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      if (prefix) {
        out[prefix] = '';
      }

      return;
    }

    value.forEach((item, index) => {
      flattenToRow(item, prefix ? `${prefix}.${index}` : String(index), out);
    });
    return;
  }

  const keys = Object.keys(value);

  if (keys.length === 0) {
    if (prefix) {
      out[prefix] = '';
    }

    return;
  }

  for (const key of keys) {
    flattenToRow(value[key], prefix ? `${prefix}.${key}` : key, out);
  }
}

function unionHeaders(rows: Array<Record<string, string>>): string[] {
  const headers: string[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key);
        headers.push(key);
      }
    }
  }

  return headers;
}

/** JSON-like value → CSV records. Nested keys use `.` paths; cells are strings. */
export function valueToRecords(value: JsonValue): Records {
  if (isScalar(value)) {
    throwConvertError(CONVERT_ERROR_CODES.CONVERSION_AMBIGUOUS);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      throwConvertError(CONVERT_ERROR_CODES.CONVERSION_AMBIGUOUS);
    }

    if (value.every(isScalar)) {
      return {
        headers: ['value'],
        rows: value.map((item) => ({ value: scalarToCell(item) })),
      };
    }

    const flatRows = value.map((item) => {
      const row: Record<string, string> = {};
      flattenToRow(item, '', row);
      return row;
    });
    const headers = unionHeaders(flatRows);

    if (headers.length === 0) {
      throwConvertError(CONVERT_ERROR_CODES.CONVERSION_AMBIGUOUS);
    }

    return {
      headers,
      rows: flatRows.map((row) => {
        const complete: Record<string, string> = {};

        for (const header of headers) {
          complete[header] = row[header] ?? '';
        }

        return complete;
      }),
    };
  }

  const row: Record<string, string> = {};
  flattenToRow(value, '', row);
  const headers = Object.keys(row);

  if (headers.length === 0) {
    throwConvertError(CONVERT_ERROR_CODES.CONVERSION_AMBIGUOUS);
  }

  return { headers, rows: [row] };
}

/**
 * Reshape IR for the target codec.
 * Returns undefined when that kind-to-kind adapter is not registered yet
 * (service then keeps the stub instead of inventing a pair-specific branch).
 */
export function adaptToTarget(
  ir: CanonicalIr,
  target: TargetFormat,
): CanonicalIr | undefined {
  if (ir.kind === 'image') {
    return undefined;
  }

  const needed = TARGET_IR_KIND[target];

  if (ir.kind === needed) {
    return ir;
  }

  return KIND_ADAPTERS[`${ir.kind}->${needed}`]?.(ir);
}

export function asRecordsIr(ir: CanonicalIr): RecordsIr | undefined {
  return ir.kind === 'records' ? ir : undefined;
}

export function asValueIr(ir: CanonicalIr): ValueIr | undefined {
  return ir.kind === 'value' ? ir : undefined;
}
