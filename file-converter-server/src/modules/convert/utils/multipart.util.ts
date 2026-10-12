export function readMultipartValue(
  fields: Record<string, unknown> | undefined,
  name: string,
): unknown {
  const field = fields?.[name];
  const sibling = Array.isArray(field) ? (field as unknown[])[0] : field;

  if (typeof sibling === 'string') {
    return sibling;
  }

  if (
    typeof sibling !== 'object' ||
    sibling === null ||
    !('value' in sibling)
  ) {
    return undefined;
  }

  const value = sibling.value;

  if (typeof value === 'string') {
    return value;
  }

  if (Buffer.isBuffer(value)) {
    return value.toString('utf8');
  }

  return value;
}

/** `undefined` means the field is present but not a boolean. */
export function parseSaveFlag(raw: unknown): boolean | undefined {
  if (raw === undefined || raw === '') {
    return false;
  }

  if (raw === true || raw === 'true') {
    return true;
  }

  if (raw === false || raw === 'false') {
    return false;
  }

  return undefined;
}
