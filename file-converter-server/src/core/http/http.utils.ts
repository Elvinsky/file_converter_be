import { FASTIFY_FILE_TOO_LARGE_CODE } from './http.constants';

export function isFastifyFileTooLarge(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === FASTIFY_FILE_TOO_LARGE_CODE
  );
}
