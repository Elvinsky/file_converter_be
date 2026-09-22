import type { FastifyReply } from 'fastify';

import { FASTIFY_FILE_TOO_LARGE_CODE } from './http.constants';

export type HttpAttachment = {
  body: Buffer;
  contentType: string;
  fileName: string;
};

export function sendAttachment(
  reply: FastifyReply,
  file: HttpAttachment,
): Buffer {
  const fileName = file.fileName.replace(/["\\\r\n]/g, '_');

  reply
    .header('Content-Type', file.contentType)
    .header('Content-Disposition', `attachment; filename="${fileName}"`)
    .header('Content-Length', String(file.body.length));

  return file.body;
}

export function isFastifyFileTooLarge(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === FASTIFY_FILE_TOO_LARGE_CODE
  );
}
