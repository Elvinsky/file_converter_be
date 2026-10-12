import { HttpException } from '@nestjs/common';
import sharp from 'sharp';

import {
  CONVERT_ERROR_CODES,
  throwConvertError,
} from '../errors/convert.errors';
import { decodeUtf8 } from '../utils/utf8.util';

import { ImageSourceFormat, ImageTargetFormat } from './image-graph';
import { assertSafeSvg } from './svg-safety';

export const DEFAULT_SVG_RASTER_SIZE = 512;

const OUTPUT: Record<
  ImageTargetFormat,
  { contentType: string; fileName: string }
> = {
  png: { contentType: 'image/png', fileName: 'converted.png' },
  jpeg: { contentType: 'image/jpeg', fileName: 'converted.jpeg' },
};

export type ImageConversionInput = {
  body: Buffer;
  source: ImageSourceFormat;
  target: ImageTargetFormat;
  width?: number;
  height?: number;
  quality: number;
  background: string;
  maxWidth: number;
  maxHeight: number;
  maxPixels: number;
};

export type ImageConversionResult = {
  body: Buffer;
  contentType: string;
  fileName: string;
};

export async function runImageConversion(
  input: ImageConversionInput,
): Promise<ImageConversionResult> {
  try {
    if (input.source === 'svg') {
      return await convertSvg(input);
    }

    return await convertRaster(input);
  } catch (error) {
    rethrowImageError(error);
  }
}

async function convertSvg(
  input: ImageConversionInput,
): Promise<ImageConversionResult> {
  const svg = decodeUtf8(input.body);

  assertSafeSvg(svg);

  const size = resolveSvgSize(svg, input);
  const pipeline = sharp(Buffer.from(svg), {
    animated: false,
    density: 72,
    failOn: 'error',
    limitInputPixels: input.maxPixels,
  })
    .resize(size.width, size.height, { fit: 'fill' })
    .flatten({ background: input.background });

  const body = await encode(pipeline, input);

  return { body, ...OUTPUT[input.target] };
}

async function convertRaster(
  input: ImageConversionInput,
): Promise<ImageConversionResult> {
  const options = {
    animated: false as const,
    failOn: 'error' as const,
    limitInputPixels: input.maxPixels,
  };
  const meta = await sharp(input.body, options).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  if (width < 1 || height < 1) {
    throwConvertError(CONVERT_ERROR_CODES.INVALID_IMAGE);
  }

  if (width * height > input.maxPixels) {
    throwConvertError(CONVERT_ERROR_CODES.LIMIT_IMAGE_PIXELS);
  }

  let pipeline = sharp(input.body, options);

  if (input.target === 'jpeg') {
    pipeline = pipeline.flatten({ background: '#ffffff' });
  }

  const body = await encode(pipeline, input);

  return { body, ...OUTPUT[input.target] };
}

function encode(
  pipeline: sharp.Sharp,
  input: ImageConversionInput,
): Promise<Buffer> {
  if (input.target === 'jpeg') {
    return pipeline.jpeg({ quality: input.quality }).toBuffer();
  }

  return pipeline.png().toBuffer();
}

function resolveSvgSize(
  svg: string,
  input: ImageConversionInput,
): { width: number; height: number } {
  const intrinsic = readSvgSize(svg);
  let width = input.width;
  let height = input.height;

  if (!width && !height) {
    width = intrinsic.width ?? DEFAULT_SVG_RASTER_SIZE;
    height = intrinsic.height ?? DEFAULT_SVG_RASTER_SIZE;
  } else if (width && !height) {
    const ratio =
      intrinsic.width && intrinsic.height
        ? intrinsic.height / intrinsic.width
        : 1;

    height = Math.max(1, Math.round(width * ratio));
  } else if (height && !width) {
    const ratio =
      intrinsic.width && intrinsic.height
        ? intrinsic.width / intrinsic.height
        : 1;

    width = Math.max(1, Math.round(height * ratio));
  }

  const resolvedWidth = Math.round(width ?? DEFAULT_SVG_RASTER_SIZE);
  const resolvedHeight = Math.round(height ?? DEFAULT_SVG_RASTER_SIZE);

  if (
    resolvedWidth < 1 ||
    resolvedHeight < 1 ||
    resolvedWidth > input.maxWidth ||
    resolvedHeight > input.maxHeight
  ) {
    throwConvertError(CONVERT_ERROR_CODES.LIMIT_IMAGE_DIMENSION);
  }

  if (resolvedWidth * resolvedHeight > input.maxPixels) {
    throwConvertError(CONVERT_ERROR_CODES.LIMIT_IMAGE_PIXELS);
  }

  return { width: resolvedWidth, height: resolvedHeight };
}

function readSvgSize(svg: string): { width?: number; height?: number } {
  const width = readLength(svg, 'width');
  const height = readLength(svg, 'height');
  const viewBox = svg.match(
    /viewBox\s*=\s*["']\s*[0-9.+\-eE]+\s+[0-9.+\-eE]+\s+([0-9.]+)\s+([0-9.]+)/i,
  );

  return {
    width: width ?? (viewBox ? Number(viewBox[1]) : undefined),
    height: height ?? (viewBox ? Number(viewBox[2]) : undefined),
  };
}

function readLength(svg: string, name: string): number | undefined {
  const match = svg.match(
    new RegExp(`\\b${name}\\s*=\\s*["']\\s*([0-9]*\\.?[0-9]+)`, 'i'),
  );

  if (!match) {
    return undefined;
  }

  const value = Number(match[1]);

  if (!Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  return value;
}

function rethrowImageError(error: unknown): never {
  if (error instanceof HttpException) {
    throw error;
  }

  const message = error instanceof Error ? error.message : '';

  if (/pixel limit|exceeds pixel/i.test(message)) {
    throwConvertError(CONVERT_ERROR_CODES.LIMIT_IMAGE_PIXELS);
  }

  throwConvertError(CONVERT_ERROR_CODES.INVALID_IMAGE);
}
