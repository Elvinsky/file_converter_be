import { createReadStream, type ReadStream, rmSync } from 'node:fs';
import type { FastifyReply } from 'fastify';

import { FASTIFY_FILE_TOO_LARGE_CODE } from './http.constants';

export type HttpAttachment = {
  body?: Buffer;
  outputPath?: string;
  size?: number;
  contentType: string;
  fileName: string;
};

export function sendAttachment(
  reply: FastifyReply,
  file: HttpAttachment,
): Buffer | ReadStream {
  const fileName = file.fileName.replace(/["\\\r\n]/g, '_');
  const length = file.body ? file.body.length : (file.size ?? 0);

  reply
    .header('Content-Type', file.contentType)
    .header('Content-Disposition', `attachment; filename="${fileName}"`)
    .header('Content-Length', String(length));

  if (file.outputPath) {
    const stream = createReadStream(file.outputPath);
    let released = false;
    const release = () => {
      if (released) {
        return;
      }

      released = true;
      rmSync(file.outputPath as string, { force: true });
    };

    stream.once('close', release);
    stream.once('error', release);

    return stream;
  }

  return file.body ?? Buffer.alloc(0);
}

export function isFastifyFileTooLarge(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === FASTIFY_FILE_TOO_LARGE_CODE
  );
}
