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

  it('returns undefined when a codec is not registered', () => {
    expect(
      runTextConversion('name\nAda\n', TargetFormat.CSV, TargetFormat.XML),
    ).toBeUndefined();
  });
});
