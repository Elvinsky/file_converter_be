import { EventEmitter } from 'node:events';
import { Worker } from 'node:worker_threads';

import { ConfigService } from '@/core/config/config.service';

import { CONVERT_ERROR_CODES } from '../errors/convert.errors';
import { ConversionWorkerPool } from '../workers/conversion-worker.pool';

class FakeWorker extends EventEmitter {
  postMessage(message: { id: number }): void {
    queueMicrotask(() => {
      this.emit('message', {
        id: message.id,
        ok: true,
        body: Buffer.from('ok'),
        contentType: 'application/json; charset=utf-8',
        fileName: 'converted.json',
      });
    });
  }

  terminate(): Promise<number> {
    return Promise.resolve(0);
  }
}

class HangingWorker extends EventEmitter {
  postMessage(): void {
    return undefined;
  }

  terminate(): Promise<number> {
    return Promise.resolve(0);
  }
}

function poolConfig(timeoutMs: number): ConfigService {
  return {
    get: (key: string) => {
      if (key === 'CONVERT_WORKER_POOL_SIZE') {
        return 1;
      }

      if (key === 'CONVERT_TIMEOUT_MS') {
        return timeoutMs;
      }

      return 0;
    },
  } as ConfigService;
}

describe('ConversionWorkerPool', () => {
  it('runs a job off the caller by posting it to a worker', async () => {
    const pool = new (class extends ConversionWorkerPool {
      protected override spawnWorker(): Worker {
        return new FakeWorker() as unknown as Worker;
      }
    })(poolConfig(1000));

    await expect(
      pool.run({
        kind: 'text',
        text: '{}',
        source: 'json',
        target: 'csv',
        limits: {},
      }),
    ).resolves.toMatchObject({
      fileName: 'converted.json',
      contentType: 'application/json; charset=utf-8',
    });

    await pool.onModuleDestroy();
  });

  it('rejects a job that exceeds the conversion time limit', async () => {
    const pool = new (class extends ConversionWorkerPool {
      protected override spawnWorker(): Worker {
        return new HangingWorker() as unknown as Worker;
      }
    })(poolConfig(20));

    await expect(
      pool.run({
        kind: 'text',
        text: '{}',
        source: 'json',
        target: 'csv',
        limits: {},
      }),
    ).rejects.toMatchObject({
      response: { code: CONVERT_ERROR_CODES.CONVERSION_TIMEOUT },
    });

    await pool.onModuleDestroy();
  });
});
