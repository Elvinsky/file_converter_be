import { ArgumentsHost, PayloadTooLargeException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

import { FastifyFileTooLargeFilter } from './http.filter';
import { FASTIFY_FILE_TOO_LARGE_CODE } from './http.constants';

describe('FastifyFileTooLargeFilter', () => {
  it('maps Fastify too-large to PayloadTooLargeException', () => {
    const filter = new FastifyFileTooLargeFilter();
    const superCatch = jest
      .spyOn(BaseExceptionFilter.prototype, 'catch')
      .mockImplementation();
    const host = {} as ArgumentsHost;

    try {
      filter.catch({ code: FASTIFY_FILE_TOO_LARGE_CODE }, host);

      expect(superCatch).toHaveBeenCalledWith(
        expect.any(PayloadTooLargeException),
        host,
      );
    } finally {
      superCatch.mockRestore();
    }
  });
});
