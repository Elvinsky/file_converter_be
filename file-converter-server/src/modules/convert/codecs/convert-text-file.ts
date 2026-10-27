import { readFile } from 'node:fs/promises';

import { TargetFormat } from '../dto/text-convert.dto';
import { ConvertedFile } from '../workers/conversion-job';
import { decodeUtf8 } from '../utils/utf8.util';
import { writeBufferFile } from '../utils/spool.util';
import { TextCodecLimits, runTextConversion } from './text-codecs';

export async function convertTextFile(
  sourcePath: string,
  source: TargetFormat,
  target: TargetFormat,
  limits: TextCodecLimits,
): Promise<ConvertedFile | undefined> {
  const text = decodeUtf8(await readFile(sourcePath));
  const converted = runTextConversion(text, source, target, limits);

  if (!converted) {
    return undefined;
  }

  const stored = await writeBufferFile(converted.body);

  return {
    ...stored,
    contentType: converted.contentType,
    fileName: converted.fileName,
  };
}
