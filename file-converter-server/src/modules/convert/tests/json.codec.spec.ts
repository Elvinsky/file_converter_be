import { CONVERT_ERROR_CODES } from '../errors/convert.errors';
import { parseJson, serializeJson } from '../codecs/json.codec';

describe('serializeJson', () => {
  it('writes compact UTF-8 JSON', () => {
    expect(serializeJson([{ name: 'Ada' }]).toString('utf8')).toBe(
      '[{"name":"Ada"}]',
    );
  });
});

describe('parseJson', () => {
  it('parses an object into value IR', () => {
    expect(parseJson('{"name":"Ada"}')).toEqual({
      kind: 'value',
      value: { name: 'Ada' },
    });
  });

  it('rejects invalid JSON', () => {
    try {
      parseJson('{');
      throw new Error('expected INVALID_SYNTAX');
    } catch (error) {
      expect(error).toMatchObject({
        response: { code: CONVERT_ERROR_CODES.INVALID_SYNTAX },
      });
    }
  });

  it('drops prototype-pollution keys', () => {
    expect(parseJson('{"name":"Ada","__proto__":{"x":1}}')).toEqual({
      kind: 'value',
      value: { name: 'Ada' },
    });
  });

  it('rejects documents deeper than maxDepth', () => {
    try {
      parseJson('{"a":{"b":{"c":1}}}', { maxDepth: 1 });
      throw new Error('expected LIMIT_DEPTH');
    } catch (error) {
      expect(error).toMatchObject({
        response: { code: CONVERT_ERROR_CODES.LIMIT_DEPTH },
      });
    }
  });

  it('rejects documents with more nodes than maxNodes', () => {
    try {
      parseJson('{"a":1,"b":2}', { maxNodes: 2 });
      throw new Error('expected LIMIT_NODES');
    } catch (error) {
      expect(error).toMatchObject({
        response: { code: CONVERT_ERROR_CODES.LIMIT_NODES },
      });
    }
  });
});
