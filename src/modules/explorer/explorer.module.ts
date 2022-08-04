import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose';
import * as config from 'config';

import { TransactionModule } from '../transaction/transaction.module';
import { WalletModule } from '../wallet/wallet.module';
import { BlockRepository } from './repositories/block.repository';
import { TransactionRepository } from './repositories/transaction.repository';
import { BlockSchema } from './schema/block.scheme';
import { TransactionSchema } from './schema/transaction/transaction.scheme';
import { ExplorerService } from './service/explorer.service';

const natsInternalConfig = config.natsInternal;

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'EXPLORER',
        transport: Transport.NATS,
        options: {
          url: natsInternalConfig.url,
        },
      },
    ]),
    MongooseModule.forFeature([
      {
        schema: BlockSchema,
        name: 'Block',
      },
      {
        schema: TransactionSchema,
        name: 'Transaction',
      },
    ]),
    TransactionModule,
    WalletModule,
  ],
  providers: [ExplorerService, BlockRepository, TransactionRepository],
  exports: [ExplorerService],
})
export class ExplorerModule {}
