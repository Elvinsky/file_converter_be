import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LessThan, Repository } from 'typeorm';

import { StorageService } from '@/modules/files/services/storage.service';

import { TransformationHistoryEntity } from '../entities/transformation-history.entity';

@Injectable()
export class TransformationCleanupService {
  private readonly logger = new Logger(TransformationCleanupService.name);

  constructor(
    @InjectRepository(TransformationHistoryEntity)
    private readonly history: Repository<TransformationHistoryEntity>,
    private readonly storage: StorageService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async removeExpired(): Promise<number> {
    let removed = 0;

    for (let batch = 0; batch < 20; batch += 1) {
      const rows = await this.history.find({
        where: { expiresAt: LessThan(new Date()) },
        take: 100,
        order: { expiresAt: 'ASC' },
      });

      if (rows.length === 0) {
        break;
      }

      for (const row of rows) {
        try {
          if (row.storageKey) {
            await this.storage.deleteObject(row.storageKey);
          }

          await this.history.delete(row.id);
          removed += 1;
        } catch {
          this.logger.error(
            `Failed to expire transformation ${row.id}; it will be retried`,
          );
        }
      }
    }

    if (removed > 0) {
      this.logger.log(`Expired ${removed} transformation history rows`);
    }

    return removed;
  }
}
