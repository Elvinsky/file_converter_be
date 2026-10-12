import {
  CONVERT_ERROR_CODES,
  convertException,
} from '../errors/convert.errors';

export function withTimeout<T>(
  work: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(convertException(CONVERT_ERROR_CODES.CONVERSION_TIMEOUT));
    }, timeoutMs);

    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error('Conversion failed'));
      },
    );
  });
}
