import { Module } from '@nestjs/common';

import { AuthModule } from '@/modules/auth/modules/auth.module';

import { ConvertController } from '../controllers/convert.controller';
import { ConvertService } from '../services/convert.service';
import { FormatDetectorService } from '../services/format-detector.service';

@Module({
  imports: [AuthModule],
  controllers: [ConvertController],
  providers: [ConvertService, FormatDetectorService],
})
export class ConvertModule {}
