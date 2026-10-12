import { ConversionJob, ConversionResult } from './conversion-job';

export const CONVERSION_RUNNER = Symbol('CONVERSION_RUNNER');

export interface ConversionRunner {
  run(job: ConversionJob): Promise<ConversionResult>;
}
