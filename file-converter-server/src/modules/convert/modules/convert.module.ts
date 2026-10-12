import { Module } from '@nestjs/common';

import { AuthModule } from '@/modules/auth/modules/auth.module';
import { TransformationsModule } from '@/modules/transformations/modules/transformations.module';

import { ConvertController } from '../controllers/convert.controller';
import { ImageConvertController } from '../controllers/image-convert.controller';
import { ConvertService } from '../services/convert.service';
import { FormatDetectorService } from '../services/format-detector.service';
import { ImageConvertService } from '../services/image-convert.service';
import { CONVERSION_RUNNER } from '../workers/conversion.constants';
import { ConversionWorkerPool } from '../workers/conversion-worker.pool';

@Module({
  imports: [AuthModule, TransformationsModule],
  controllers: [ConvertController, ImageConvertController],
  providers: [
    ConvertService,
    ImageConvertService,
    FormatDetectorService,
    ConversionWorkerPool,
    {
      provide: CONVERSION_RUNNER,
      useExisting: ConversionWorkerPool,
    },
  ],
})
export class ConvertModule {}
