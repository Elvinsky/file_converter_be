import { type ReadStream } from 'node:fs';
import { access, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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

    it('streams a spooled file and removes it when the stream closes', async () => {
      const outputPath = join(tmpdir(), `attachment-${Date.now()}.txt`);

      await writeFile(outputPath, 'abc');

      const header = jest.fn().mockReturnThis();
      const stream = sendAttachment({ header } as never, {
        outputPath,
        size: 3,
        contentType: 'text/plain',
        fileName: 'a.txt',
      }) as ReadStream;

      expect(header).toHaveBeenCalledWith('Content-Length', '3');
      stream.destroy();
      await new Promise<void>((resolve) => {
        stream.once('close', () => resolve());
      });
      await expect(access(outputPath)).rejects.toThrow();
    });
  });
});
