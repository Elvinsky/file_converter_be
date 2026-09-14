export const trimString = ({ value }: { value?: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export const trimNullableString = ({ value }: { value?: unknown }): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim() || null;
};

export const trimStringArray = ({ value }: { value?: unknown }): unknown => {
  if (!Array.isArray(value)) {
    return value;
  }

  const items: unknown[] = value;

  return items.map((item) => (typeof item === 'string' ? item.trim() : item));
};
