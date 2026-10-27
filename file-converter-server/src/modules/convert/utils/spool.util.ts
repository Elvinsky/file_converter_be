import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, open, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const SPOOL_DIR = join(tmpdir(), 'file-converter-spool');

export async function spoolStream(
  source: Readable,
): Promise<{ path: string; size: number }> {
  await mkdir(SPOOL_DIR, { recursive: true });
  const path = join(SPOOL_DIR, randomUUID());
  let size = 0;
  const counter = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      size += chunk.length;
      callback(null, chunk);
    },
  });

  try {
    await pipeline(source, counter, createWriteStream(path));
  } catch (error) {
    await rm(path, { force: true });
    throw error;
  }

  return { path, size };
}

export async function readFilePrefix(
  path: string,
  limit: number,
): Promise<Buffer> {
  const handle = await open(path, 'r');

  try {
    const buffer = Buffer.alloc(limit);
    const { bytesRead } = await handle.read(buffer, 0, limit, 0);

    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

export async function writeBufferFile(
  body: Buffer,
): Promise<{ outputPath: string; size: number }> {
  await mkdir(SPOOL_DIR, { recursive: true });
  const outputPath = join(SPOOL_DIR, randomUUID());

  await writeFile(outputPath, body);

  return { outputPath, size: body.length };
}

export async function allocateOutputPath(): Promise<string> {
  await mkdir(SPOOL_DIR, { recursive: true });

  return join(SPOOL_DIR, randomUUID());
}
