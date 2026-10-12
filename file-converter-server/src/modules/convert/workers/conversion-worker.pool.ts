import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';

import { ConfigService } from '@/core/config/config.service';

import {
  CONVERT_ERROR_CODES,
  convertException,
  isConvertErrorCode,
} from '../errors/convert.errors';

import { ConversionJob, ConversionResult } from './conversion-job';

type WorkerResponse = {
  id: number;
  ok: boolean;
  body?: Uint8Array;
  contentType?: string;
  fileName?: string;
  code?: string;
  message?: string;
};

type PendingJob = {
  id: number;
  job: ConversionJob;
  resolve: (result: ConversionResult) => void;
  reject: (error: unknown) => void;
  timer: NodeJS.Timeout;
  worker?: Worker;
};

@Injectable()
export class ConversionWorkerPool implements OnModuleDestroy {
  private readonly logger = new Logger(ConversionWorkerPool.name);
  private readonly workers: Worker[] = [];
  private readonly idle: Worker[] = [];
  private readonly pending = new Map<number, PendingJob>();
  private readonly workerJob = new Map<Worker, number>();
  private nextId = 1;
  private closed = false;

  constructor(private readonly config: ConfigService) {
    const size = this.config.get('CONVERT_WORKER_POOL_SIZE');

    for (let index = 0; index < size; index += 1) {
      this.track(this.spawnWorker());
    }
  }

  run(job: ConversionJob): Promise<ConversionResult> {
    if (this.closed) {
      return Promise.reject(
        convertException(CONVERT_ERROR_CODES.CONVERT_INTERNAL),
      );
    }

    return new Promise((resolve, reject) => {
      const id = this.nextId;
      this.nextId += 1;
      const timeoutMs = this.config.get('CONVERT_TIMEOUT_MS');
      const pending: PendingJob = {
        id,
        job,
        resolve,
        reject,
        timer: setTimeout(() => this.failTimeout(id), timeoutMs),
      };

      this.pending.set(id, pending);
      this.dispatch();
    });
  }

  async onModuleDestroy(): Promise<void> {
    this.closed = true;
    await Promise.all(this.workers.map((worker) => worker.terminate()));
    this.workers.length = 0;
    this.idle.length = 0;
  }

  protected spawnWorker(): Worker {
    const filename = resolveWorkerFilename();

    return new Worker(filename, {
      execArgv: filename.endsWith('.ts')
        ? [
            '--require',
            'ts-node/register/transpile-only',
            '--require',
            'tsconfig-paths/register',
          ]
        : [],
    });
  }

  private track(worker: Worker): void {
    worker.on('message', (message: WorkerResponse) => {
      this.onMessage(worker, message);
    });
    worker.on('error', (error: Error) => {
      this.logger.error(`Conversion worker failed: ${error.message}`);
      this.replaceWorker(worker, CONVERT_ERROR_CODES.CONVERT_INTERNAL);
    });
    worker.on('exit', (code) => {
      if (this.closed || !this.workers.includes(worker)) {
        return;
      }

      if (code !== 0) {
        this.replaceWorker(worker, CONVERT_ERROR_CODES.CONVERT_INTERNAL);
      }
    });
    this.workers.push(worker);
    this.idle.push(worker);
  }

  private dispatch(): void {
    while (this.idle.length > 0) {
      const next = [...this.pending.values()].find((item) => !item.worker);

      if (!next) {
        return;
      }

      const worker = this.idle.pop();

      if (!worker) {
        return;
      }

      next.worker = worker;
      this.workerJob.set(worker, next.id);
      const copy =
        next.job.kind === 'image' ? Buffer.from(next.job.body) : undefined;

      worker.postMessage(
        copy
          ? { ...next.job, id: next.id, body: copy }
          : { ...next.job, id: next.id },
      );
    }
  }

  private onMessage(worker: Worker, message: WorkerResponse): void {
    const pending = this.pending.get(message.id);

    if (!pending) {
      this.release(worker);
      return;
    }

    this.release(worker);
    clearTimeout(pending.timer);
    this.pending.delete(message.id);

    if (message.ok && message.body && message.contentType && message.fileName) {
      pending.resolve({
        body: Buffer.from(message.body),
        contentType: message.contentType,
        fileName: message.fileName,
      });
      return;
    }

    const code =
      message.code && isConvertErrorCode(message.code)
        ? message.code
        : CONVERT_ERROR_CODES.CONVERT_INTERNAL;

    pending.reject(convertException(code, message.message));
  }

  private failTimeout(id: number): void {
    const pending = this.pending.get(id);

    if (!pending) {
      return;
    }

    this.pending.delete(id);
    pending.reject(convertException(CONVERT_ERROR_CODES.CONVERSION_TIMEOUT));

    if (pending.worker) {
      this.replaceWorker(pending.worker);
    }
  }

  private release(worker: Worker): void {
    this.workerJob.delete(worker);

    if (!this.idle.includes(worker) && this.workers.includes(worker)) {
      this.idle.push(worker);
    }

    this.dispatch();
  }

  private replaceWorker(
    worker: Worker,
    code?: (typeof CONVERT_ERROR_CODES)[keyof typeof CONVERT_ERROR_CODES],
  ): void {
    if (this.closed || !this.workers.includes(worker)) {
      return;
    }

    const jobId = this.workerJob.get(worker);
    const index = this.workers.indexOf(worker);

    this.workers.splice(index, 1);
    this.removeIdle(worker);
    this.workerJob.delete(worker);

    if (jobId !== undefined && code) {
      const pending = this.pending.get(jobId);

      if (pending) {
        clearTimeout(pending.timer);
        this.pending.delete(jobId);
        pending.reject(convertException(code));
      }
    }

    void worker.terminate();

    if (!this.closed) {
      this.track(this.spawnWorker());
      this.dispatch();
    }
  }

  private removeIdle(worker: Worker): void {
    const index = this.idle.indexOf(worker);

    if (index >= 0) {
      this.idle.splice(index, 1);
    }
  }
}

export function resolveWorkerFilename(): string {
  const compiled = join(__dirname, 'conversion.worker.js');

  if (existsSync(compiled)) {
    return compiled;
  }

  return join(__dirname, 'conversion.worker.ts');
}
