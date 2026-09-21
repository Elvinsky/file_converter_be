import { Module } from '@nestjs/common';

import { AuthModule } from '@/modules/auth/modules/auth.module';

@Module({
  imports: [AuthModule],
})
export class ConvertModule {}
