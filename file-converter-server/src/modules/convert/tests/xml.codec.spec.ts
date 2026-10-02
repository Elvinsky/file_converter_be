import { CONVERT_ERROR_CODES } from '../errors/convert.errors';
import { parseXml, serializeXml } from '../codecs/xml.codec';

describe('parseXml', () => {
  it('parses elements, attributes, and mixed text', () => {
    expect(parseXml('<person id="1">Ada<city>Paris</city></person>')).toEqual({
      kind: 'value',
      value: {
        person: {
          city: 'Paris',
          '#text': 'Ada',
          '@_id': '1',
        },
      },
    });
  });

  it('rejects DOCTYPE / entity declarations', () => {
    try {
      parseXml(
        '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><r>&xxe;</r>',
      );
      throw new Error('expected INVALID_SYNTAX');
    } catch (error) {
      expect(error).toMatchObject({
        response: { code: CONVERT_ERROR_CODES.INVALID_SYNTAX },
      });
    }
  });

  it('rejects malformed XML', () => {
    try {
      parseXml('<root><child></root>');
      throw new Error('expected INVALID_SYNTAX');
    } catch (error) {
      expect(error).toMatchObject({
        response: { code: CONVERT_ERROR_CODES.INVALID_SYNTAX },
      });
    }
  });
});

describe('serializeXml', () => {
  it('wraps an object in <root>', () => {
    expect(serializeXml({ name: 'Ada', age: 36 }).toString('utf8')).toBe(
      '<root><name>Ada</name><age>36</age></root>',
    );
  });

  it('serializes a root array as repeating item elements', () => {
    expect(
      serializeXml([{ name: 'Ada' }, { name: 'Bob' }]).toString('utf8'),
    ).toBe(
      '<root><item><name>Ada</name></item><item><name>Bob</name></item></root>',
    );
  });
});
