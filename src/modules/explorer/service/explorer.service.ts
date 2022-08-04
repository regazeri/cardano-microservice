/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import * as config from 'config';
import { debug, log } from 'console';
import * as _ from 'lodash';
import { lastValueFrom } from 'rxjs';

import { BlockResDto } from '../../cardano/dto';
import { DisableSync } from '../../mixins/decorators';
import { TransactionService } from '../../transaction/service/transaction.service';
import { WalletService } from '../../wallet/service/wallet.service';
import { BlockNewDto, CreateBlockStatusDto } from '../dtos';
import { BlockSyncStatus } from '../enums/block-sync-status';
import { BlockRepository } from '../repositories/block.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { CardanoService } from './../../cardano/services/cardano.service';

@Injectable()
export class ExplorerService implements OnApplicationBootstrap {
  private readonly _symbol = config.coin.symbol;
  private _logger = new Logger(ExplorerService.name);
  public blockHeightInBlockchainOnApplicationBootstrap: number = null;
  public blockHeightInBlockchainOnFirstCronJobIteration: number = null;
  public currentBlockchainHeight: number = null;

  private _initSyncIsFinished = false;
  private readonly _useRequestDelay = config.coin.useRequestDelay;
  private readonly _delayWriteMills = config.coin.delayWriteMills;

  constructor(
    private _cardanoService: CardanoService,
    private _blockRepository: BlockRepository,
    @Inject('EXPLORER')
    private _natsConnection: ClientProxy,
    private _transactionRepository: TransactionRepository,
    private _transactionService: TransactionService,
    private _walletService: WalletService,
  ) {}
  public get isInitialized() {
    return this._initSyncIsFinished;
  }

  async onApplicationBootstrap(): Promise<void> {
    await this._initialSyncWithBlockchain();
  }

  @DisableSync()
  private async _initialSyncWithBlockchain(): Promise<void> {
    try {
      const latestBlockInBlockchain = await this.getCurrentBlockchainHeight();
      this._logger.debug(
        `block height in blockchain on application bootstrap: ${latestBlockInBlockchain}`,
      );

      const maxBlockHeightInDB = await this.getMaxHeightInDb();
      this._logger.debug(
        `block height in DB on application bootstrap: ${maxBlockHeightInDB}`,
      );
      this.blockHeightInBlockchainOnApplicationBootstrap =
        latestBlockInBlockchain;
      if (
        maxBlockHeightInDB >= latestBlockInBlockchain ||
        !latestBlockInBlockchain
      ) {
        return;
      }
      await this._blockRepository.setOldBlockSyncStatuses();

      await this.syncLatestBlocksOnApplicationBootstrap(
        +maxBlockHeightInDB + 1,
        latestBlockInBlockchain,
      ).catch(e => this._logger.error(e));
    } catch (err) {
      throw new Error(err);
    }
  }

  async getMaxHeightInDb(): Promise<number> {
    return this._blockRepository.findMaxHeight();
  }

  async getCurrentBlockchainHeight(): Promise<number> {
    return this._cardanoService.getCurrentBlockchainHeight();
  }
  async syncLatestBlocksOnApplicationBootstrap(
    start: number,
    end: number,
  ): Promise<void> {
    try {
      await this.syncRange(start, end);
      this._logger.debug('Syncing latest blocks finished.');

      this._logger.debug('Init synchronization finished.');
    } catch (err) {
      log('syncLatestBlocksOnApplicationBootstrap/error: ', err);
      throw new Error(err);
    } finally {
      this._initSyncIsFinished = true;
    }
  }

  async syncRange(start: number, end: number): Promise<BlockResDto[]> {
    if (start > end || !end) {
      return;
    }
    try {
      let blocks;
      // TODO check if 100 has optimal performance or not
      const chunkLen = 100;

      for (let rangeStart = start; rangeStart <= end; rangeStart += chunkLen) {
        const rangeEnd = Math.min(rangeStart + chunkLen - 1, end);
        this._logger.debug(
          `syncRange started: ${rangeStart}, end: ${rangeEnd};`,
        );
        blocks = await this.saveGroupBlockAndTxsByOne(rangeStart, rangeEnd);
        if (this._useRequestDelay) {
          await this.wait(this._delayWriteMills);
        }
      }

      return blocks;
    } catch (err) {
      log('syncRange/error: ', err);
      throw new Error(err);
    }
  }

  async saveGroupBlockAndTxsByOne(
    start: number,
    end: number,
  ): Promise<BlockResDto[]> {
    if (start > end || !end) {
      return;
    }
    const blocks = await this._cardanoService.getBlocksInRange(start, end);
    for (const block of blocks) {
      await this.saveBlockAndTxs(block);
    }
    return blocks;
  }
  async saveBlockAndTxs(block: BlockResDto): Promise<CreateBlockStatusDto> {
    const blockToSave = { ...block };
    blockToSave.syncStatus = BlockSyncStatus.CREATED;
    delete blockToSave.transactions;
    const result = await this._blockRepository.create(blockToSave);

    if (result.isNowCreated && block.trxCount) {
      try {
        await this._transactionRepository.createMultiple(block.transactions);
      } catch (err) {
        this._logger.error(
          `Could not save transactions for block: ${block.number}`,
          err,
        );
      }
    }
    await this._blockRepository.setBlockStatus(
      block.number,
      BlockSyncStatus.SAVED,
    );
    return result;
  }
  async checkBlockTransactionsChunk(): Promise<void> {
    const blocks = await this._blockRepository.findSavedBlocksChunk(100);
    if (blocks.length === 0) {
      return;
    }
    for (const block of blocks) {
      try {
        await this.checkBlockTransactions(block);
      } catch (err) {
        this._logger.error(
          `checkBlockTransactionsChunk/error: ${block.number}`,
          err,
        );
      }
    }
  }

  async checkBlockTransactions(block: any): Promise<void> {
    const number = +block.number || 0;
    block.checkAttempts = (+block.checkAttempts || 0) + 1;
    await block.save();
    if (!block.txCount) {
      block.syncStatus = BlockSyncStatus.TRANSACTIONSCHECKED;
      await block.save();
      return;
    }
    const transactions = await this._transactionRepository.getByHeight(number);
    if (+block.txCount <= transactions.length) {
      block.txCount = transactions.length;
      block.syncStatus = BlockSyncStatus.TRANSACTIONSCHECKED;
      await block.save();
      return;
    }

    const remoteTransactions =
      await this._cardanoService.getTransactionFromBlock(number);

    if (remoteTransactions.length <= transactions.length) {
      block.syncStatus = BlockSyncStatus.TRANSACTIONSCHECKED;
      block.txCount = remoteTransactions;
      await block.save();
      return;
    }

    const transactionsToSave = remoteTransactions.filter(
      t => !transactions.some(tr => tr.txId === t.txId),
    );

    if (!transactionsToSave.length) {
      block.syncStatus = BlockSyncStatus.TRANSACTIONSCHECKED;
      block.txCount = remoteTransactions.length;
      await block.save();
      return;
    }
    await this._transactionRepository.createMultiple(transactionsToSave);
    return;
  }

  async notifyBlockTransaction(
    blockNumber: number,
    blockTimestamp: string,
    transactions: any,
  ): Promise<void> {
    const txHashes = {
      blockTimestamp,
      txHashes: transactions.map(tx => tx.txID) as string[],
      blockHeight: blockNumber,
    };
    try {
      await this._transactionService.sendRecentTxsToServiceCore(txHashes);
    } catch (err) {
      this._logger.error(`notifyBlockTransaction/error: ${blockNumber}`, err);
    }
  }

  async getAddressesAndFlatten(trxs): Promise<any[]> {
    return trxs.map(tx => {
      const inputAddr = tx.inputs.map(input => {
        if (input.address) {
          return input.address;
        }
        return [];
      });
      const outputAddr = tx.outputs.map(output => {
        if (output.address) {
          return output.address;
        }
        return [];
      });
      const inputAddrFlat = _.flatten(inputAddr);
      const outputAddrFlat = _.flatten(outputAddr);
      return {
        vinAddr: inputAddrFlat,
        voutAddr: outputAddrFlat,
      };
    });
  }
  async notifyBlockBalances(transactions): Promise<void> {
    const result = await this.getAddressesAndFlatten(transactions);
    const addresses = result.map(vv => _.union(vv.vinAddr, vv.voutAddr));
    const txsAddresses = {
      addresses: _.flatten(addresses),
      symbol: this._symbol,
    };
    if (!txsAddresses.addresses.length) {
      debug(
        'sendTransactionsAndWalletBalanceToServiceCore ended with nothing to get from observable wallets',
      );
      return;
    }
    const walletAddresses =
      await this._walletService.getObservableByServiceCoreWallets(txsAddresses);
    debug('walletAddresses: ', walletAddresses);

    if (!!walletAddresses.addresses && walletAddresses.addresses.length !== 0) {
      const balances = await Promise.all(
        walletAddresses.addresses.map(async address =>
          this._walletService.getAccountBalance({ address }),
        ),
      );
      const sendingData = { balances };
      await this._walletService.sendWalletBalancesUpdate(sendingData);
    }
  }

  async notifyBlock(block): Promise<void> {
    const currentBlockchainHeight = block.number || 0;
    const blockTimestamp = new Date(block.timestamp).toISOString();

    await this.sendNewBlockInfoToServiceCore({
      blockTimestamp,
      height: currentBlockchainHeight,
    });
    const transactions = await this._transactionRepository.getByHeight(
      +block.number || 0,
    );
    if (!transactions.length) {
      block.syncStatus = BlockSyncStatus.FINISHED;
      await block.save();
      return;
    }
    try {
      await this.notifyBlockTransaction(
        currentBlockchainHeight,
        blockTimestamp,
        transactions,
      );
      await this.notifyBlockBalances(transactions);
    } catch (err) {
      this._logger.error(`notifyBlock/error: ${block.number}`, err);
    }
    block.syncStatus = BlockSyncStatus.FINISHED;
    await block.save();
  }

  async notifyBlocksChunk(): Promise<void> {
    const blocks = await this._blockRepository.findCheckedBlocksChunk(100);
    for (const block of blocks) {
      try {
        await this.notifyBlock(block);
      } catch (err) {
        this._logger.error(`notifyBlocksChunk/error: ${block.number}`, err);
      }
    }
  }

  async syncMissingBlocks(): Promise<void> {
    const range = await this._blockRepository.getFirstGapsRange();
    if (!range) {
      return;
    }
    const { start, end } = range;
    this._logger.log(`Fill gaps range from ${start} to ${end}`);

    const lastChecked = start - 1;
    try {
      await this._blockRepository.setGapsChecked(lastChecked);
    } catch (err) {
      this._logger.error(
        `Failed to set checked gaps block ${lastChecked}`,
        err,
      );
    }
    await this.syncRange(start, Math.min(+start + 99, end));
  }

  async sendNewBlockInfoToServiceCore(dto: BlockNewDto): Promise<any> {
    const blockInfo$ = this._natsConnection.emit(
      `block.new.${this._symbol}`,
      dto,
    );
    return await lastValueFrom(blockInfo$);
  }

  async wait(milliseconds: number): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, milliseconds);
    });
  }
}
