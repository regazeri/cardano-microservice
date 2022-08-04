import { Module } from '@nestjs/common';

import { CardanBIP39Provider } from './provider/cardano-bip-provider';
import { CardanFetchProvider } from './provider/cardano-graphql-fech.provider';
import { CardanoWasmProvider } from './provider/cardano-wasm-provider';
import { CardanoService } from './services/cardano.service';

@Module({
  imports: [],
  providers: [
    CardanoService,
    CardanoWasmProvider,
    CardanBIP39Provider,
    CardanFetchProvider,
  ],
  exports: [CardanoService],
})
export class CardanoModule {}
