import { Module } from '@nestjs/common';

import { PrivateKeyService } from './service/priv-key.service';

@Module({
  imports: [],
  providers: [PrivateKeyService],
  exports: [PrivateKeyService],
})
export class PrivateKeyModule {}
