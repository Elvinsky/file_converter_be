import { FASTIFY_FILE_TOO_LARGE_CODE } from './http.constants';
import { isFastifyFileTooLarge, sendAttachment } from './http.utils';

describe('http.utils', () => {
  describe('isFastifyFileTooLarge', () => {
    it('matches FST_REQ_FILE_TOO_LARGE', () => {
      expect(isFastifyFileTooLarge({ code: FASTIFY_FILE_TOO_LARGE_CODE })).toBe(
        true,
      );
      expect(isFastifyFileTooLarge(new Error('nope'))).toBe(false);
    });
  });

  describe('sendAttachment', () => {
    it('sets download headers and returns the body', () => {
      const header = jest.fn().mockReturnThis();
      const body = Buffer.from('[{"name":"Ada"}]');

      expect(
        sendAttachment({ header } as never, {
          body,
          contentType: 'application/json; charset=utf-8',
          fileName: 'converted.json',
        }),
      ).toBe(body);

      expect(header).toHaveBeenCalledWith(
        'Content-Type',
        'application/json; charset=utf-8',
      );
      expect(header).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="converted.json"',
      );
      expect(header).toHaveBeenCalledWith(
        'Content-Length',
        String(body.length),
      );
    });
  });
});
