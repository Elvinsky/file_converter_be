export const IMAGE_SOURCE_FORMATS = ['png', 'jpeg', 'svg'] as const;

export type ImageSourceFormat = (typeof IMAGE_SOURCE_FORMATS)[number];

export const IMAGE_TARGET_FORMATS = ['png', 'jpeg'] as const;

export type ImageTargetFormat = (typeof IMAGE_TARGET_FORMATS)[number];

const TARGETS: Record<ImageSourceFormat, ImageTargetFormat[]> = {
  png: ['jpeg'],
  jpeg: ['png'],
  svg: ['png', 'jpeg'],
};

export function isImageSourceFormat(value: string): value is ImageSourceFormat {
  return IMAGE_SOURCE_FORMATS.includes(value as ImageSourceFormat);
}

export function normalizeImageTargetFormat(value: string): string {
  const normalized = value.trim().toLowerCase();

  if (
    normalized === 'jpg' ||
    normalized === 'image/jpg' ||
    normalized === 'image/jpeg'
  ) {
    return 'jpeg';
  }

  if (normalized === 'image/png') {
    return 'png';
  }

  if (normalized === 'image/svg+xml' || normalized === 'svg+xml') {
    return 'svg';
  }

  return normalized;
}

export function isImageTargetFormat(value: string): value is ImageTargetFormat {
  return value === 'png' || value === 'jpeg' || value === 'svg';
}

export function parseImageTargetFormat(
  value: string,
): ImageTargetFormat | undefined {
  const normalized = normalizeImageTargetFormat(value);

  return isImageTargetFormat(normalized) ? normalized : undefined;
}

export function isImagePairAllowed(
  source: string,
  target: string,
): target is ImageTargetFormat {
  if (!isImageSourceFormat(source)) {
    return false;
  }

  return TARGETS[source].includes(target as ImageTargetFormat);
}

export function getImageFormatsCatalog(): Array<{
  source: ImageSourceFormat;
  target: ImageTargetFormat[];
}> {
  return IMAGE_SOURCE_FORMATS.map((source) => ({
    source,
    target: [...TARGETS[source]],
  }));
}
