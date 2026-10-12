import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ConfigService } from '@/core/config/config.service';
import { HttpAttachment } from '@/core/http/http.utils';
import { StorageService } from '@/modules/files/services/storage.service';
import { UsersService } from '@/modules/users/services/users.service';

import { TransformationHistoryEntity } from '../entities/transformation-history.entity';
import { encodeCursor, parseHistoryQuery } from '../history-query';
import { TransformationAuditService } from './transformation-audit.service';

export type RecordTransformationInput = {
  userId: string;
  type: 'file' | 'image';
  sourceFormat: string;
  targetFormat: string;
  status: 'success' | 'error';
  fileSize: number;
  durationMs: number;
  errorCode?: string;
  save: boolean;
  body?: Buffer;
  contentType?: string;
  fileName?: string;
};

export type HistoryItem = {
  id: string;
  type: 'file' | 'image';
  sourceFormat: string;
  targetFormat: string;
  status: 'success' | 'error';
  fileSize: number;
  durationMs: number;
  errorCode?: string;
  createdAt: Date;
  hasFile: boolean;
};

@Injectable()
export class TransformationHistoryService {
  private readonly logger = new Logger(TransformationHistoryService.name);

  constructor(
    @InjectRepository(TransformationHistoryEntity)
    private readonly history: Repository<TransformationHistoryEntity>,
    private readonly users: UsersService,
    private readonly storage: StorageService,
    private readonly audit: TransformationAuditService,
    private readonly config: ConfigService,
  ) {}

  async record(input: RecordTransformationInput): Promise<void> {
    const retentionMs =
      this.config.get('TRANSFORMATION_RETENTION_DAYS') * 24 * 60 * 60 * 1000;
    const row = await this.history.save(
      this.history.create({
        userId: input.userId,
        type: input.type,
        sourceFormat: input.sourceFormat,
        targetFormat: input.targetFormat,
        status: input.status,
        fileSize: input.fileSize,
        durationMs: input.durationMs,
        errorCode: input.errorCode ?? null,
        storageKey: null,
        resultFileName: null,
        contentType: null,
        expiresAt: new Date(Date.now() + retentionMs),
      }),
    );

    this.logger.log(
      `transformation userId=${input.userId} type=${input.type} source=${input.sourceFormat} target=${input.targetFormat} bytes=${input.fileSize} result=${input.status} code=${input.errorCode ?? ''} durationMs=${input.durationMs}`,
    );

    if (
      input.status === 'success' &&
      input.save &&
      input.body &&
      input.fileName &&
      input.contentType
    ) {
      this.startSave(row, input);
    }
  }

  async listOwn(
    userId: string,
    rawQuery: object,
  ): Promise<{ items: HistoryItem[]; nextCursor: string | null }> {
    await this.assertActive(userId);

    return this.list(userId, userId, rawQuery);
  }

  async listForAdmin(
    actorUserId: string,
    targetUserId: string,
    rawQuery: object,
  ): Promise<{ items: HistoryItem[]; nextCursor: string | null }> {
    await this.users.getUserById(targetUserId);

    return this.list(actorUserId, targetUserId, rawQuery);
  }

  async downloadOwn(userId: string, itemId: string): Promise<HttpAttachment> {
    await this.assertActive(userId);

    const row = await this.history.findOne({ where: { id: itemId } });

    if (!row) {
      throw new NotFoundException('Transformation not found');
    }

    if (row.userId !== userId) {
      throw new ForbiddenException(
        'Transformation does not belong to the current user',
      );
    }

    return this.sendStoredFile(userId, userId, row);
  }

  async downloadForAdmin(
    actorUserId: string,
    targetUserId: string,
    itemId: string,
  ): Promise<HttpAttachment> {
    await this.users.getUserById(targetUserId);

    const row = await this.history.findOne({
      where: { id: itemId, userId: targetUserId },
    });

    if (!row) {
      throw new NotFoundException('Transformation not found');
    }

    return this.sendStoredFile(actorUserId, targetUserId, row);
  }

  private async list(
    actorUserId: string,
    targetUserId: string,
    rawQuery: object,
  ): Promise<{ items: HistoryItem[]; nextCursor: string | null }> {
    const query = parseHistoryQuery(rawQuery);
    const builder = this.history
      .createQueryBuilder('history')
      .where('history.userId = :userId', { userId: targetUserId });

    if (query.type) {
      builder.andWhere('history.type = :type', { type: query.type });
    }

    if (query.sourceFormat) {
      builder.andWhere('history.sourceFormat = :sourceFormat', {
        sourceFormat: query.sourceFormat,
      });
    }

    if (query.targetFormat) {
      builder.andWhere('history.targetFormat = :targetFormat', {
        targetFormat: query.targetFormat,
      });
    }

    if (query.status) {
      builder.andWhere('history.status = :status', { status: query.status });
    }

    if (query.createdAtFrom) {
      builder.andWhere('history.createdAt >= :createdAtFrom', {
        createdAtFrom: query.createdAtFrom,
      });
    }

    if (query.createdAtTo) {
      builder.andWhere('history.createdAt <= :createdAtTo', {
        createdAtTo: query.createdAtTo,
      });
    }

    if (query.cursor) {
      builder.andWhere(
        '(history.createdAt < :cursorCreatedAt OR (history.createdAt = :cursorCreatedAt AND history.id < :cursorId))',
        {
          cursorCreatedAt: new Date(query.cursor.createdAtMs),
          cursorId: query.cursor.id,
        },
      );
    }

    const rows = await builder
      .orderBy('history.createdAt', 'DESC')
      .addOrderBy('history.id', 'DESC')
      .take(query.limit + 1)
      .getMany();
    const page = rows.slice(0, query.limit);
    const last = page.at(-1);
    const nextCursor =
      rows.length > query.limit && last
        ? encodeCursor(last.createdAt, last.id)
        : null;

    await this.audit.record({
      actorUserId,
      targetUserId,
      action: 'history_view',
      result: '200',
      detail: JSON.stringify({
        type: query.type ?? null,
        sourceFormat: query.sourceFormat ?? null,
        targetFormat: query.targetFormat ?? null,
        status: query.status ?? null,
        createdAtFrom: query.createdAtFrom?.toISOString() ?? null,
        createdAtTo: query.createdAtTo?.toISOString() ?? null,
        limit: query.limit,
        count: page.length,
      }),
    });

    return {
      items: page.map((row) => this.toItem(row)),
      nextCursor,
    };
  }

  private async sendStoredFile(
    actorUserId: string,
    targetUserId: string,
    row: TransformationHistoryEntity,
  ): Promise<HttpAttachment> {
    if (!row.storageKey || row.expiresAt.getTime() <= Date.now()) {
      throw new NotFoundException('Stored file is not available');
    }

    const started = Date.now();
    const body = await this.storage.getObject(row.storageKey);

    await this.audit.record({
      actorUserId,
      targetUserId,
      action: 'download',
      transformationId: row.id,
      fileId: row.storageKey,
      result: '200',
      fileSize: body.length,
      durationMs: Date.now() - started,
    });

    return {
      body,
      contentType: row.contentType ?? 'application/octet-stream',
      fileName: row.resultFileName ?? 'converted.bin',
    };
  }

  private startSave(
    row: TransformationHistoryEntity,
    input: RecordTransformationInput,
  ): void {
    void this.persist(row, input).catch(() => {
      this.logger.error(`Save failed for transformation ${row.id}`);
    });
  }

  private async persist(
    row: TransformationHistoryEntity,
    input: RecordTransformationInput,
  ): Promise<void> {
    const started = Date.now();
    const key = `transformations/${input.userId}/${row.id}/${input.fileName}`;

    try {
      await this.storage.putObject({
        key,
        body: input.body as Buffer,
        contentType: input.contentType,
      });
      await this.history.update(row.id, {
        storageKey: key,
        resultFileName: input.fileName,
        contentType: input.contentType,
      });
      await this.audit.record({
        actorUserId: input.userId,
        targetUserId: input.userId,
        action: 'save',
        transformationId: row.id,
        fileId: key,
        result: 'success',
        fileSize: input.body?.length ?? null,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      await this.audit.record({
        actorUserId: input.userId,
        targetUserId: input.userId,
        action: 'save',
        transformationId: row.id,
        fileId: null,
        result: 'error',
        fileSize: input.body?.length ?? null,
        durationMs: Date.now() - started,
        detail: error instanceof Error ? error.name : 'storage_error',
      });
      throw error;
    }
  }

  private async assertActive(userId: string): Promise<void> {
    const user = await this.users.findUserById(userId);

    if (!user?.isActive) {
      throw new UnauthorizedException('User is not active');
    }
  }

  private toItem(row: TransformationHistoryEntity): HistoryItem {
    const item: HistoryItem = {
      id: row.id,
      type: row.type,
      sourceFormat: row.sourceFormat,
      targetFormat: row.targetFormat,
      status: row.status,
      fileSize: row.fileSize,
      durationMs: row.durationMs,
      createdAt: row.createdAt,
      hasFile: Boolean(row.storageKey) && row.expiresAt.getTime() > Date.now(),
    };

    if (row.errorCode) {
      item.errorCode = row.errorCode;
    }

    return item;
  }
}
