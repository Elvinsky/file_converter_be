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

  it('rejects nesting above maxDepth', () => {
    const xml = `<r>${'<n>'.repeat(8)}1${'</n>'.repeat(8)}</r>`;

    try {
      parseXml(xml, { maxDepth: 2 });
      throw new Error('expected LIMIT_DEPTH');
    } catch (error) {
      expect(error).toMatchObject({
        response: { code: CONVERT_ERROR_CODES.LIMIT_DEPTH },
      });
    }
  });

  it('rejects documents above maxNodes', () => {
    try {
      parseXml('<root><a>1</a><b>2</b><c>3</c><d>4</d></root>', {
        maxNodes: 2,
      });
      throw new Error('expected LIMIT_NODES');
    } catch (error) {
      expect(error).toMatchObject({
        response: { code: CONVERT_ERROR_CODES.LIMIT_NODES },
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
