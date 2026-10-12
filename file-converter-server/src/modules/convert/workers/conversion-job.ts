import { TextCodecLimits } from '../codecs/text-codecs';
import { ImageSourceFormat, ImageTargetFormat } from '../images/image-graph';

export type TextConversionJob = {
  kind: 'text';
  text: string;
  source: string;
  target: string;
  limits: TextCodecLimits;
};

export type ImageConversionJob = {
  kind: 'image';
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

export type ConversionJob = TextConversionJob | ImageConversionJob;

export type ConversionResult = {
  body: Buffer;
  contentType: string;
  fileName: string;
};
