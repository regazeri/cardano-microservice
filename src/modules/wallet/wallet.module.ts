import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import * as config from 'config';

import { CardanoModule } from '../cardano/cardano.module';
import { WalletController } from './controller/wallet.controller';
import { WalletService } from './service/wallet.service';

const natsInternalConfig = config.natsInternal;

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'WALLET',
        transport: Transport.NATS,
        options: {
          url: natsInternalConfig.url,
        },
      },
    ]),
    CardanoModule,
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
