import { CONVERT_ERROR_CODES } from '../errors/convert.errors';
import { parseYaml, serializeYaml } from '../codecs/yaml.codec';

describe('parseYaml', () => {
  it('parses a CORE_SCHEMA mapping', () => {
    expect(parseYaml('name: Ada\nage: 36\n')).toEqual({
      kind: 'value',
      value: { name: 'Ada', age: 36 },
    });
  });

  it('rejects duplicate keys', () => {
    try {
      parseYaml('a: 1\na: 2\n');
      throw new Error('expected INVALID_SYNTAX');
    } catch (error) {
      expect(error).toMatchObject({
        response: { code: CONVERT_ERROR_CODES.INVALID_SYNTAX },
      });
    }
  });

  it('rejects alias bombs above maxAliases', () => {
    const bomb = [
      'a: &a ["x"]',
      'b: &b [*a,*a,*a,*a]',
      'c: &c [*b,*b,*b,*b]',
    ].join('\n');

    try {
      parseYaml(bomb, { maxAliases: 2 });
      throw new Error('expected INVALID_SYNTAX');
    } catch (error) {
      expect(error).toMatchObject({
        response: { code: CONVERT_ERROR_CODES.INVALID_SYNTAX },
      });
    }
  });
});

describe('serializeYaml', () => {
  it('dumps CORE_SCHEMA YAML without aliases', () => {
    expect(
      serializeYaml({ name: 'Ada', tags: ['a', 'b'] }).toString('utf8'),
    ).toBe('name: Ada\ntags:\n  - a\n  - b\n');
  });
});
