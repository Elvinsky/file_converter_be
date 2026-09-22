import { ArgumentsHost, Catch, PayloadTooLargeException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

import { isFastifyFileTooLarge } from './http.utils';

@Catch()
export class FastifyFileTooLargeFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    if (isFastifyFileTooLarge(exception)) {
      super.catch(new PayloadTooLargeException(), host);
      return;
    }

    super.catch(exception, host);
  }
}
