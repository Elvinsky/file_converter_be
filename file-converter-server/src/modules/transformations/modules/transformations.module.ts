import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ThrottlerModule } from '@/core/throttler/throttler.module';
import { AuthModule } from '@/modules/auth/modules/auth.module';
import { FilesModule } from '@/modules/files/modules/files.module';
import { RbacModule } from '@/modules/rbac/modules/rbac.module';
import { UsersModule } from '@/modules/users/modules/users.module';

import { AdminTransformationHistoryController } from '../controllers/admin-transformation-history.controller';
import { TransformationHistoryController } from '../controllers/transformation-history.controller';
import { TransformationAuditEntity } from '../entities/transformation-audit.entity';
import { TransformationHistoryEntity } from '../entities/transformation-history.entity';
import { HistoryAuditFilter } from '../filters/history-audit.filter';
import { TransformationAuditService } from '../services/transformation-audit.service';
import { TransformationCleanupService } from '../services/transformation-cleanup.service';
import { TransformationHistoryService } from '../services/transformation-history.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TransformationHistoryEntity,
      TransformationAuditEntity,
    ]),
    AuthModule,
    FilesModule,
    UsersModule,
    RbacModule,
    ThrottlerModule,
  ],
  controllers: [
    TransformationHistoryController,
    AdminTransformationHistoryController,
  ],
  providers: [
    TransformationHistoryService,
    TransformationAuditService,
    TransformationCleanupService,
    HistoryAuditFilter,
  ],
  exports: [TransformationHistoryService],
})
export class TransformationsModule {}
