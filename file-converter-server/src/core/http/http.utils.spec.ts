import { FASTIFY_FILE_TOO_LARGE_CODE } from './http.constants';
import { isFastifyFileTooLarge } from './http.utils';

describe('http.utils', () => {
  describe('isFastifyFileTooLarge', () => {
    it('matches FST_REQ_FILE_TOO_LARGE', () => {
      expect(isFastifyFileTooLarge({ code: FASTIFY_FILE_TOO_LARGE_CODE })).toBe(
        true,
      );
      expect(isFastifyFileTooLarge(new Error('nope'))).toBe(false);
    });
  });
});
