import { Controller, Post } from '@nestjs/common';
import { ConvertService } from '../services/convert.service';

@Controller('convert')
export class ConvertController {
  constructor(private readonly convertService: ConvertService) {}

  @Post('convert')
  async upload() {}
}
