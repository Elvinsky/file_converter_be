import { TargetFormat } from '../dto/text-convert.dto';
import { adaptToTarget, recordsToValue, valueToRecords } from '../ir/adapters';
import { Records, RecordsIr } from '../ir/canonical.types';

describe('recordsToValue', () => {
  it('maps each row to an object using header order', () => {
    const records: Records = {
      headers: ['name', 'age'],
      rows: [
        { name: 'Ada', age: '36' },
        { name: 'Bob', age: '' },
      ],
    };

    expect(recordsToValue(records)).toEqual([
      { name: 'Ada', age: '36' },
      { name: 'Bob', age: '' },
    ]);
  });

  it('returns an empty array when there are no data rows', () => {
    expect(
      recordsToValue({
        headers: ['name'],
        rows: [],
      }),
    ).toEqual([]);
  });
});

describe('adaptToTarget', () => {
  const recordsIr: RecordsIr = {
    kind: 'records',
    records: {
      headers: ['name'],
      rows: [{ name: 'Ada' }],
    },
  };

  it('converts records to value for JSON/XML/YAML', () => {
    expect(adaptToTarget(recordsIr, TargetFormat.JSON)).toEqual({
      kind: 'value',
      value: [{ name: 'Ada' }],
    });
  });

  it('leaves records unchanged when the target is CSV', () => {
    expect(adaptToTarget(recordsIr, TargetFormat.CSV)).toEqual(recordsIr);
  });

  it('converts value to records for CSV', () => {
    expect(
      adaptToTarget(
        { kind: 'value', value: [{ name: 'Ada' }] },
        TargetFormat.CSV,
      ),
    ).toEqual({
      kind: 'records',
      records: {
        headers: ['name'],
        rows: [{ name: 'Ada' }],
      },
    });
  });
});

describe('valueToRecords', () => {
  it('flattens nested objects and arrays with dotted paths', () => {
    expect(
      valueToRecords({
        name: 'Ada',
        address: { city: 'Paris' },
        tags: ['a', 'b'],
      }),
    ).toEqual({
      headers: ['name', 'address.city', 'tags.0', 'tags.1'],
      rows: [
        {
          name: 'Ada',
          'address.city': 'Paris',
          'tags.0': 'a',
          'tags.1': 'b',
        },
      ],
    });
  });

  it('uses a value column for an array of scalars', () => {
    expect(valueToRecords([1, null, true])).toEqual({
      headers: ['value'],
      rows: [{ value: '1' }, { value: '' }, { value: 'true' }],
    });
  });

  it('rejects an empty array or a top-level scalar', () => {
    expect(() => valueToRecords([])).toThrow();
    expect(() => valueToRecords('nope')).toThrow();
  });
});
