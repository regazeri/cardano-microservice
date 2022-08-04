import { Module } from '@nestjs/common';

import { ExplorerModule } from '../explorer/explorer.module';
import { TransactionModule } from '../transaction/transaction.module';
import { WalletModule } from '../wallet/wallet.module';
import { CronService } from './service/cron.service';

@Module({
  imports: [WalletModule, ExplorerModule, TransactionModule],
  providers: [CronService],
  exports: [CronService],
})
export class CronModule {}
