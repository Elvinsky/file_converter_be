import { BadRequestException } from '@nestjs/common';

export const HISTORY_ERROR_CODES = {
  INVALID_CURSOR: 'INVALID_CURSOR',
  INVALID_FILTER: 'INVALID_FILTER',
  INVALID_LIMIT: 'INVALID_LIMIT',
} as const;

const FORMATS = new Set(['csv', 'json', 'xml', 'yaml', 'png', 'jpeg', 'svg']);

const TYPES = new Set(['file', 'image']);
const STATUSES = new Set(['success', 'error']);

export type HistoryQuery = {
  cursor?: { createdAtMs: number; id: string };
  limit: number;
  type?: 'file' | 'image';
  sourceFormat?: string;
  targetFormat?: string;
  status?: 'success' | 'error';
  createdAtFrom?: Date;
  createdAtTo?: Date;
};

export function parseHistoryQuery(raw: object): HistoryQuery {
  const query = raw as Record<string, unknown>;
  const limit = parseLimit(query.limit);
  const type = parseEnum(query.type, TYPES, 'type') as HistoryQuery['type'];
  const status = parseEnum(query.status, STATUSES, 'status') as
    | HistoryQuery['status']
    | undefined;
  const sourceFormat = parseFormat(query.sourceFormat, 'sourceFormat');
  const targetFormat = parseFormat(query.targetFormat, 'targetFormat');
  const createdAtFrom = parseDate(query.createdAtFrom, 'createdAtFrom');
  const createdAtTo = parseDate(query.createdAtTo, 'createdAtTo');

  if (createdAtFrom && createdAtTo && createdAtFrom > createdAtTo) {
    throw historyError(
      HISTORY_ERROR_CODES.INVALID_FILTER,
      'createdAtFrom must not be after createdAtTo',
    );
  }

  return {
    cursor: parseCursor(query.cursor),
    limit,
    type,
    sourceFormat,
    targetFormat,
    status,
    createdAtFrom,
    createdAtTo,
  };
}

export function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(
    JSON.stringify({ createdAtMs: createdAt.getTime(), id }),
  ).toString('base64url');
}

function parseLimit(value: unknown): number {
  if (value === undefined || value === '') {
    return 20;
  }

  if (typeof value !== 'string' || !/^[0-9]+$/.test(value)) {
    throw historyError(
      HISTORY_ERROR_CODES.INVALID_LIMIT,
      'limit must be an integer from 1 to 100',
    );
  }

  const limit = Number(value);

  if (limit < 1 || limit > 100) {
    throw historyError(
      HISTORY_ERROR_CODES.INVALID_LIMIT,
      'limit must be an integer from 1 to 100',
    );
  }

  return limit;
}

function parseEnum(
  value: unknown,
  allowed: Set<string>,
  name: string,
): string | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }

  if (typeof value !== 'string' || !allowed.has(value)) {
    throw historyError(
      HISTORY_ERROR_CODES.INVALID_FILTER,
      `${name} is invalid`,
    );
  }

  return value;
}

function parseFormat(value: unknown, name: string): string | undefined {
  return parseEnum(value, FORMATS, name);
}

function parseDate(value: unknown, name: string): Date | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }

  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw historyError(
      HISTORY_ERROR_CODES.INVALID_FILTER,
      `${name} must be a datetime`,
    );
  }

  return new Date(value);
}

function parseCursor(
  value: unknown,
): { createdAtMs: number; id: string } | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw historyError(HISTORY_ERROR_CODES.INVALID_CURSOR, 'cursor is invalid');
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(value, 'base64url').toString('utf8'),
    ) as { createdAtMs?: unknown; id?: unknown };

    if (
      typeof parsed.createdAtMs !== 'number' ||
      !Number.isFinite(parsed.createdAtMs) ||
      typeof parsed.id !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        parsed.id,
      )
    ) {
      throw new Error('invalid');
    }

    return { createdAtMs: parsed.createdAtMs, id: parsed.id };
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }

    throw historyError(HISTORY_ERROR_CODES.INVALID_CURSOR, 'cursor is invalid');
  }
}

function historyError(code: string, message: string): BadRequestException {
  return new BadRequestException({ code, message });
}
