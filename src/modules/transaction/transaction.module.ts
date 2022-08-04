import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose';
import * as config from 'config';

import { TransactionRepository } from '../explorer/repositories/transaction.repository';
import { TransactionSchema } from '../explorer/schema/transaction/transaction.scheme';
import { PrivateKeyModule } from '../priv-key/priv-key.module';
import { WalletModule } from '../wallet/wallet.module';
import { TransactionController } from './controller/transaction.controller';
import { TransactionService } from './service/transaction.service';

const natsInternalConfig = config.natsInternal;

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'TRANSACTION',
        transport: Transport.NATS,
        options: {
          url: natsInternalConfig.url,
        },
      },
    ]),
    MongooseModule.forFeature([
      {
        schema: TransactionSchema,
        name: 'Transaction',
      },
    ]),
    PrivateKeyModule,
    WalletModule,
  ],
  controllers: [TransactionController],
  providers: [TransactionService, TransactionRepository],
  exports: [TransactionService],
})
export class TransactionModule {}
