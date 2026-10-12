import { BadRequestException } from '@nestjs/common';

import { encodeCursor, parseHistoryQuery } from '../history-query';

function thrown(run: () => void): BadRequestException {
  try {
    run();
  } catch (error) {
    if (error instanceof BadRequestException) {
      return error;
    }

    throw error;
  }

  throw new Error('expected a bad request');
}

describe('history query', () => {
  it('uses a page of 20 when limit is omitted', () => {
    expect(parseHistoryQuery({})).toMatchObject({ limit: 20 });
  });

  it('rejects a limit above 100', () => {
    expect(
      thrown(() => parseHistoryQuery({ limit: '101' })).getResponse(),
    ).toMatchObject({
      code: 'INVALID_LIMIT',
    });
  });

  it('rejects an unknown type', () => {
    expect(
      thrown(() => parseHistoryQuery({ type: 'video' })).getResponse(),
    ).toMatchObject({
      code: 'INVALID_FILTER',
    });
  });

  it('round-trips a cursor', () => {
    const createdAt = new Date('2026-01-02T03:04:05.000Z');
    const id = '11111111-1111-4111-8111-111111111111';
    const parsed = parseHistoryQuery({ cursor: encodeCursor(createdAt, id) });

    expect(parsed.cursor).toEqual({
      createdAtMs: createdAt.getTime(),
      id,
    });
  });

  it('rejects a cursor that is not a page token', () => {
    expect(
      thrown(() => parseHistoryQuery({ cursor: 'not-a-cursor' })).getResponse(),
    ).toMatchObject({
      code: 'INVALID_CURSOR',
    });
  });
});
