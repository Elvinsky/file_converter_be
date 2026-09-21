export type Scalar = string | number | boolean | null;

export type JsonObject = { [key: string]: JsonValue };

export type JsonValue = Scalar | JsonValue[] | JsonObject;

export type Records = {
  headers: string[];
  rows: Array<Record<string, string>>;
};

export type RecordsIr = {
  kind: 'records';
  records: Records;
};

export type ValueIr = {
  kind: 'value';
  value: JsonValue;
};

export type CanonicalIr = RecordsIr | ValueIr;
