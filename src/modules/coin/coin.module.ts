import { Module } from '@nestjs/common';

import { CoinService } from './service/coin.service';

@Module({
  imports: [],
  providers: [CoinService],
  exports: [CoinService],
})
export class CoinModule {}
