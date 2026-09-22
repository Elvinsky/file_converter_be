import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

import { FastifyFileTooLargeFilter } from './http.filter';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: FastifyFileTooLargeFilter,
    },
  ],
})
export class HttpModule {}
