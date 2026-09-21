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

/** Raster metadata only; pixel bytes stay on the job/worker, not in this tree. */
export type ImageIr = {
  kind: 'image';
  format: string;
  width: number;
  height: number;
  channels: number;
};

export type CanonicalIr = RecordsIr | ValueIr | ImageIr;
