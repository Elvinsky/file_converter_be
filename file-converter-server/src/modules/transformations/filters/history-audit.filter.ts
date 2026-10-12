import {
  ArgumentsHost,
  Catch,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';

import { TransformationAuditService } from '../services/transformation-audit.service';

type HistoryRequest = {
  url?: string;
  user?: { id?: string };
  params?: { userId?: string };
  query?: Record<string, unknown>;
};

@Catch()
@Injectable()
export class HistoryAuditFilter extends BaseExceptionFilter {
  constructor(
    private readonly audit: TransformationAuditService,
    httpAdapterHost: HttpAdapterHost,
  ) {
    super(httpAdapterHost.httpAdapter);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const request = host.switchToHttp().getRequest<HistoryRequest>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;
    const actorUserId = request.user?.id;

    if (actorUserId && (status === 401 || status === 403 || status === 404)) {
      const action = request.url?.includes('/download')
        ? 'download'
        : 'history_view';

      void this.audit
        .record({
          actorUserId,
          targetUserId: request.params?.userId ?? actorUserId,
          action,
          result: String(status),
          detail: safeQuery(request.query),
        })
        .catch(() => undefined);
    }

    super.catch(exception, host);
  }
}

function safeQuery(query: Record<string, unknown> | undefined): string {
  if (!query) {
    return '';
  }

  const allowed = [
    'cursor',
    'limit',
    'type',
    'sourceFormat',
    'targetFormat',
    'status',
    'createdAtFrom',
    'createdAtTo',
  ];
  const detail: Record<string, unknown> = {};

  for (const key of allowed) {
    if (typeof query[key] === 'string') {
      detail[key] = query[key];
    }
  }

  return JSON.stringify(detail);
}
