import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

import {
  CONVERT_ERROR_CODES,
  throwConvertError,
} from '../errors/convert.errors';
import { Records, RecordsIr } from '../ir/canonical.types';

export type ParseCsvOptions = {
  maxRows?: number;
};

export function parseCsv(
  text: string,
  options: ParseCsvOptions = {},
): RecordsIr {
  let table: string[][];

  try {
    table = parse(text, {
      bom: false,
      columns: false,
      delimiter: ',',
      quote: '"',
      relax_column_count: false,
      skip_empty_lines: false,
      trim: false,
    });
  } catch {
    throwConvertError(CONVERT_ERROR_CODES.INVALID_SYNTAX);
  }

  if (table.length === 0) {
    throwConvertError(CONVERT_ERROR_CODES.INVALID_SYNTAX);
  }

  const headers = table[0] ?? [];

  if (headers.length === 0 || headers.some((header) => header.trim() === '')) {
    throwConvertError(CONVERT_ERROR_CODES.INVALID_SYNTAX);
  }

  if (new Set(headers).size !== headers.length) {
    throwConvertError(CONVERT_ERROR_CODES.INVALID_SYNTAX);
  }

  const dataRows = table.slice(1);
  const maxRows = options.maxRows;

  if (maxRows !== undefined && dataRows.length > maxRows) {
    throwConvertError(CONVERT_ERROR_CODES.LIMIT_ROWS);
  }

  const records: Records = {
    headers,
    rows: dataRows.map((cells) => {
      const row: Record<string, string> = {};

      headers.forEach((header, index) => {
        row[header] = cells[index] ?? '';
      });

      return row;
    }),
  };

  return { kind: 'records', records };
}

export function serializeCsv(
  records: Records,
  options: ParseCsvOptions = {},
): Buffer {
  if (options.maxRows !== undefined && records.rows.length > options.maxRows) {
    throwConvertError(CONVERT_ERROR_CODES.LIMIT_ROWS);
  }

  const csv = stringify(records.rows, {
    bom: false,
    columns: records.headers,
    header: true,
    quoted_string: true,
    record_delimiter: '\n',
  });

  return Buffer.from(csv, 'utf8');
}
