import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { log } from 'console';

import { DisableSync, LimitOverlaps } from '../../mixins/decorators';
import { ExplorerService } from './../../explorer/service/explorer.service';

@Injectable()
export class CronService {
  private _logger = new Logger(CronService.name);

  constructor(private readonly _explorerService: ExplorerService) {}
  @Cron(CronExpression.EVERY_SECOND)
  @DisableSync()
  async explorerContinuousSynchronization(): Promise<void> {
    if (!this._explorerService.isInitialized) {
      return;
    }

    try {
      const currentBlockchainHeight =
        await this._explorerService.getCurrentBlockchainHeight();

      const currentBlockInDb = await this._explorerService.getMaxHeightInDb();
      if (currentBlockInDb >= currentBlockchainHeight) {
        return;
      }

      this._logger.log(
        `Save blocks from ${currentBlockInDb} to ${currentBlockchainHeight}`,
      );
      await this._explorerService.syncRange(
        currentBlockInDb + 1,
        currentBlockchainHeight,
      );
    } catch (err) {
      log(err);
    }
  }
  @Cron(CronExpression.EVERY_SECOND)
  @LimitOverlaps(1, true)
  @DisableSync()
  async checkBlocksTransactions(): Promise<void> {
    await this._explorerService.checkBlockTransactionsChunk();
  }

  @Cron(CronExpression.EVERY_SECOND)
  @LimitOverlaps(1, true)
  @DisableSync()
  async sendTransactionNotifications(): Promise<void> {
    await this._explorerService.notifyBlocksChunk();
  }

  @Cron(CronExpression.EVERY_SECOND)
  @LimitOverlaps(1, true)
  @DisableSync()
  async syncMissingBlocks(): Promise<void> {
    await this._explorerService.syncMissingBlocks();
  }
}
