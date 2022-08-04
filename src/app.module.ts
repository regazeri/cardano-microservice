import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { CardanoModule } from './modules/cardano/cardano.module';
import { CoinModule } from './modules/coin/coin.module';
import { CronModule } from './modules/cron/cron.module';
import { ExplorerModule } from './modules/explorer/explorer.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { WalletModule } from './modules/wallet/wallet.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: './.env',
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    WalletModule,
    TransactionModule,
    CronModule,
    ExplorerModule,
    CoinModule,
    CardanoModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
