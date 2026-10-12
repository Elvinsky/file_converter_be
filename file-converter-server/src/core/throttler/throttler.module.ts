import { Module } from '@nestjs/common';
import { ThrottlerModule as NestThrottlerModule } from '@nestjs/throttler';

import { ConfigModule } from '@/core/config/config.module';
import { ConfigService } from '@/core/config/config.service';

@Module({
  imports: [
    NestThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const ttl = Number(config.get('THROTTLE_GLOBAL_TTL'));
        const limit = Number(config.get('THROTTLE_GLOBAL_LIMIT'));

        return [
          {
            name: 'default',
            ttl,
            limit,
          },
          {
            name: 'history',
            ttl: Number(config.get('HISTORY_RATE_TTL_MS')),
            limit: Number(config.get('HISTORY_RATE_LIMIT')),
          },
          {
            name: 'historyAdmin',
            ttl: Number(config.get('HISTORY_RATE_TTL_MS')),
            limit: Number(config.get('HISTORY_ADMIN_RATE_LIMIT')),
          },
        ];
      },
    }),
  ],
  exports: [NestThrottlerModule],
})
export class ThrottlerModule {}
