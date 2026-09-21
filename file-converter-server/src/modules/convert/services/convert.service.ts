import { Injectable } from '@nestjs/common';

@Injectable()
export class ConvertService {
  constructor(private readonly convertService: ConvertService) {}
}
