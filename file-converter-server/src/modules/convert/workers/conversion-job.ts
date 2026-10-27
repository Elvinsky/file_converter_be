import { TextCodecLimits } from '../codecs/text-codecs';
import { ImageSourceFormat, ImageTargetFormat } from '../images/image-graph';

export type TextConversionJob = {
  kind: 'text';
  sourcePath: string;
  source: string;
  target: string;
  limits: TextCodecLimits;
};

export type ImageConversionJob = {
  kind: 'image';
  sourcePath: string;
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

export type ConversionJob = TextConversionJob | ImageConversionJob;

export type ConvertedFile = {
  outputPath: string;
  size: number;
  contentType: string;
  fileName: string;
};

export type ConversionResult = ConvertedFile;
