import { HttpException } from '@nestjs/common';
import { parentPort } from 'node:worker_threads';

import { convertTextFile } from '../codecs/convert-text-file';
import { TextCodecLimits } from '../codecs/text-codecs';
import { TargetFormat } from '../dto/text-convert.dto';
import {
  CONVERT_ERROR_CODES,
  isConvertErrorCode,
} from '../errors/convert.errors';
import { ImageSourceFormat, ImageTargetFormat } from '../images/image-graph';
import { runImageConversion } from '../images/run-image-conversion';

type WorkerJob = {
  id: number;
  kind: 'text' | 'image';
  sourcePath: string;
  source: string;
  target: string;
  limits?: TextCodecLimits;
  width?: number;
  height?: number;
  quality?: number;
  background?: string;
  maxWidth?: number;
  maxHeight?: number;
  maxPixels?: number;
};

if (parentPort) {
  parentPort.on('message', (job: WorkerJob) => {
    void handle(job);
  });
}

async function handle(job: WorkerJob): Promise<void> {
  try {
    const result =
      job.kind === 'text' ? await convertText(job) : await convertImage(job);

    if (!result) {
      reply(job.id, {
        ok: false,
        code: CONVERT_ERROR_CODES.CONVERT_INTERNAL,
        message: 'Conversion failed',
      });
      return;
    }

    reply(job.id, {
      ok: true,
      outputPath: result.outputPath,
      size: result.size,
      contentType: result.contentType,
      fileName: result.fileName,
    });
  } catch (error) {
    reply(job.id, { ok: false, ...serializeError(error) });
  }
}

function convertText(job: WorkerJob) {
  return convertTextFile(
    job.sourcePath,
    job.source as TargetFormat,
    job.target as TargetFormat,
    job.limits ?? {},
  );
}

function convertImage(job: WorkerJob) {
  return runImageConversion({
    sourcePath: job.sourcePath,
    source: job.source as ImageSourceFormat,
    target: job.target as ImageTargetFormat,
    width: job.width,
    height: job.height,
    quality: job.quality ?? 80,
    background: job.background ?? '#ffffff',
    maxWidth: job.maxWidth ?? 8192,
    maxHeight: job.maxHeight ?? 8192,
    maxPixels: job.maxPixels ?? 16777216,
  });
}

function serializeError(error: unknown): { code: string; message: string } {
  if (error instanceof HttpException) {
    const response = error.getResponse();

    if (
      typeof response === 'object' &&
      response !== null &&
      'code' in response
    ) {
      const code = String((response as { code: unknown }).code);
      const message =
        'message' in response &&
        typeof (response as { message: unknown }).message === 'string'
          ? (response as { message: string }).message
          : 'Conversion failed';

      if (isConvertErrorCode(code)) {
        return { code, message };
      }
    }
  }

  return {
    code: CONVERT_ERROR_CODES.CONVERT_INTERNAL,
    message: 'Conversion failed',
  };
}

function reply(id: number, payload: Record<string, unknown>): void {
  parentPort?.postMessage({ id, ...payload });
}
