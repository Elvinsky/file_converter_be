import { CONVERT_ERROR_CODES } from '../errors/convert.errors';
import { parseCsv, serializeCsv } from '../codecs/csv.codec';

describe('parseCsv', () => {
  it('parses a header plus rows into records of strings', () => {
    expect(parseCsv('name,age\nAda,36\nBob,')).toEqual({
      kind: 'records',
      records: {
        headers: ['name', 'age'],
        rows: [
          { name: 'Ada', age: '36' },
          { name: 'Bob', age: '' },
        ],
      },
    });
  });

  it('keeps only headers when there are no data rows', () => {
    expect(parseCsv('name,age\n')).toEqual({
      kind: 'records',
      records: {
        headers: ['name', 'age'],
        rows: [],
      },
    });
  });

  it('rejects duplicate headers', () => {
    try {
      parseCsv('name,name\nAda,Bob');
      throw new Error('expected INVALID_SYNTAX');
    } catch (error) {
      expect(error).toMatchObject({
        response: { code: CONVERT_ERROR_CODES.INVALID_SYNTAX },
      });
    }
  });

  it('rejects a ragged row', () => {
    try {
      parseCsv('name,age\nAda');
      throw new Error('expected INVALID_SYNTAX');
    } catch (error) {
      expect(error).toMatchObject({
        response: { code: CONVERT_ERROR_CODES.INVALID_SYNTAX },
      });
    }
  });

  it('rejects more data rows than maxRows', () => {
    try {
      parseCsv('name\nAda\nBob', { maxRows: 1 });
      throw new Error('expected LIMIT_ROWS');
    } catch (error) {
      expect(error).toMatchObject({
        response: { code: CONVERT_ERROR_CODES.LIMIT_ROWS },
      });
    }
  });
});

describe('serializeCsv', () => {
  it('writes a header row and quoted string cells', () => {
    expect(
      serializeCsv({
        headers: ['name', 'age'],
        rows: [{ name: 'Ada', age: '36' }],
      }).toString('utf8'),
    ).toBe('"name","age"\n"Ada","36"\n');
  });
});
