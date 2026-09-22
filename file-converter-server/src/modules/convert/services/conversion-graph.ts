import { TargetFormat } from '../dto/text-convert.dto';

export const GRAPH_FORMATS = [
  TargetFormat.CSV,
  TargetFormat.JSON,
  TargetFormat.XML,
  TargetFormat.YAML,
] as const;

export type ConvertFormat = (typeof GRAPH_FORMATS)[number];

const TARGETS: Record<ConvertFormat, ConvertFormat[]> = {
  [TargetFormat.CSV]: [TargetFormat.JSON, TargetFormat.XML, TargetFormat.YAML],
  [TargetFormat.JSON]: [TargetFormat.CSV, TargetFormat.XML, TargetFormat.YAML],
  [TargetFormat.XML]: [TargetFormat.CSV, TargetFormat.JSON, TargetFormat.YAML],
  [TargetFormat.YAML]: [TargetFormat.CSV, TargetFormat.JSON, TargetFormat.XML],
};

export function toConvertFormat(
  format: string | TargetFormat,
): ConvertFormat | undefined {
  return GRAPH_FORMATS.find((item) => String(item) === format);
}

export function isPairAllowed(
  source: string | TargetFormat,
  target: string | TargetFormat,
): boolean {
  const from = toConvertFormat(source);
  const to = toConvertFormat(target);

  if (!from || !to || from === to) {
    return false;
  }

  return TARGETS[from].includes(to);
}

export function getFormatsCatalog(): Array<{
  source: ConvertFormat;
  target: ConvertFormat[];
}> {
  return GRAPH_FORMATS.map((source) => ({
    source,
    target: [...TARGETS[source]],
  }));
}
