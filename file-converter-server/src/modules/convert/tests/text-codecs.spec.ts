import { TargetFormat } from '../dto/text-convert.dto';
import { runTextConversion } from '../codecs/text-codecs';

describe('runTextConversion', () => {
  it('runs CSV parse → records-to-value → JSON serialize', () => {
    expect(
      runTextConversion(
        'name,age\nAda,36\n',
        TargetFormat.CSV,
        TargetFormat.JSON,
      ),
    ).toEqual({
      body: Buffer.from('[{"name":"Ada","age":"36"}]'),
      contentType: 'application/json; charset=utf-8',
      fileName: 'converted.json',
    });
  });

  it('runs JSON parse → value-to-records → CSV serialize', () => {
    const result = runTextConversion(
      '[{"name":"Ada","age":36}]',
      TargetFormat.JSON,
      TargetFormat.CSV,
    );

    expect(result?.contentType).toBe('text/csv; charset=utf-8');
    expect(result?.fileName).toBe('converted.csv');
    expect(result?.body.toString('utf8')).toBe('"name","age"\n"Ada","36"\n');
  });

  it('converts JSON to XML through value IR', () => {
    const result = runTextConversion(
      '{"name":"Ada"}',
      TargetFormat.JSON,
      TargetFormat.XML,
    );

    expect(result?.fileName).toBe('converted.xml');
    expect(result?.body.toString('utf8')).toBe('<root><name>Ada</name></root>');
  });

  it('converts YAML to JSON through value IR', () => {
    const result = runTextConversion(
      'name: Ada\n',
      TargetFormat.YAML,
      TargetFormat.JSON,
    );

    expect(result).toEqual({
      body: Buffer.from('{"name":"Ada"}'),
      contentType: 'application/json; charset=utf-8',
      fileName: 'converted.json',
    });
  });

  it('converts CSV to YAML through records→value', () => {
    const result = runTextConversion(
      'name\nAda\n',
      TargetFormat.CSV,
      TargetFormat.YAML,
    );

    expect(result?.fileName).toBe('converted.yaml');
    expect(result?.body.toString('utf8')).toBe('- name: Ada\n');
  });
});
