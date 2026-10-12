import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  TransformationAuditAction,
  TransformationAuditEntity,
} from '../entities/transformation-audit.entity';

export type AuditInput = {
  actorUserId: string;
  targetUserId?: string | null;
  action: TransformationAuditAction;
  transformationId?: string | null;
  fileId?: string | null;
  result: string;
  fileSize?: number | null;
  durationMs?: number | null;
  detail?: string | null;
};

@Injectable()
export class TransformationAuditService {
  private readonly logger = new Logger(TransformationAuditService.name);

  constructor(
    @InjectRepository(TransformationAuditEntity)
    private readonly audits: Repository<TransformationAuditEntity>,
  ) {}

  async record(input: AuditInput): Promise<void> {
    const detail = input.detail ? input.detail.slice(0, 1000) : null;

    await this.audits.save(
      this.audits.create({
        actorUserId: input.actorUserId,
        targetUserId: input.targetUserId ?? null,
        action: input.action,
        transformationId: input.transformationId ?? null,
        fileId: input.fileId ?? null,
        result: input.result,
        fileSize: input.fileSize ?? null,
        durationMs: input.durationMs ?? null,
        detail,
      }),
    );

    this.logger.log(
      `audit action=${input.action} actorUserId=${input.actorUserId} targetUserId=${input.targetUserId ?? ''} transformationId=${input.transformationId ?? ''} fileId=${input.fileId ?? ''} result=${input.result} bytes=${input.fileSize ?? ''} durationMs=${input.durationMs ?? ''}`,
    );
  }
}
