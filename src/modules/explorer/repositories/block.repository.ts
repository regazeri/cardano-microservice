import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isDefined } from 'class-validator';
import * as config from 'config';
import { debug, log } from 'console';
import { Model } from 'mongoose';

import { AsyncRetry } from '../../mixins/decorators';
import { BlockDto, CreateBlockStatusDto } from '../dtos';
import { BlockSyncStatus } from '../enums/block-sync-status';

@Injectable()
export class BlockRepository {
  private readonly _originBlockNumber = config.coin.originBlockNumber;

  constructor(@InjectModel('Block') private readonly _blockModel: Model<any>) {}
  async create(block: BlockDto): Promise<CreateBlockStatusDto> {
    try {
      const isExist = await this.findByHeight(block.number);
      if (isDefined(isExist)) {
        debug(`Block by number: ${block.number} already exist`);
        return { isNowCreated: false };
      }
      {
        await this._blockModel.create(block);
        return { isNowCreated: true };
      }
    } catch (err) {
      log('create block/error: ', err);
      throw new Error(err);
    }
  }

  async findByHeight(height: number): Promise<any[]> {
    try {
      return this._blockModel.findOne({ number: height }).exec();
    } catch (err) {
      log('findByHeight block/error: ', err);
      throw new Error(err);
    }
  }
  async setBlockStatus(height: number, status: BlockSyncStatus): Promise<void> {
    await this._blockModel.updateOne(
      { number: height },
      {
        $set: { syncStatus: status },
      },
    );
  }
  async setOldBlockSyncStatuses(): Promise<void> {
    try {
      await this._blockModel.updateMany(
        {
          syncStatus: { $exists: false },
        },
        {
          $set: { syncStatus: BlockSyncStatus.FINISHED },
        },
      );
    } catch (err) {
      log('findByHeight/error: ', err);
      throw new Error(err);
    }
  }
  async findMaxHeight(): Promise<number> {
    try {
      return this._blockModel
        .findOne({})
        .sort({ number: -1 })
        .select('number')
        .exec()
        .then(block => {
          if (!block) {
            return this._originBlockNumber;
          }
          return parseInt(block.get('number'), 10);
        });
    } catch (err) {
      log('findMaxHeight/error: ', err);
      throw new Error(err);
    }
  }
  async findCheckedBlocksChunk(chunkSize: number) {
    try {
      return await this._blockModel
        .find({
          syncStatus: BlockSyncStatus.TRANSACTIONSCHECKED,
        })
        .sort({ number: -1 })
        .limit(chunkSize);
    } catch (err) {
      log('findSavedBlocksChunk/error', err);
      return [];
    }
  }

  async findSavedBlocksChunk(chunkSize: number): Promise<any[]> {
    try {
      return await this._blockModel
        .find({
          syncStatus: BlockSyncStatus.SAVED,
          $or: [
            { checkAttempts: { $lt: 10 } },
            { checkAttempts: { $exists: false } },
          ],
        })
        .sort({ number: -1 })
        .limit(chunkSize);
    } catch (err) {
      log('findSavedBlocksChunk/error', err);
      return [];
    }
  }
  async countInRange(start: number, end: number) {
    return this._blockModel
      .find({
        $and: [{ number: { $gte: start } }, { number: { $lte: end } }],
      })
      .count();
  }

  @AsyncRetry({
    maxRetries: 10,
    delay: 0.1,
    retryErrors: () => true,
  })
  async getGapsCheckedLen() {
    const lastObj = await this._blockModel
      .findOne({ gapsChecked: true })
      .sort({ number: -1 });
    if (!lastObj || !+lastObj.number) {
      return 0;
    }
    return +lastObj.number + 1;
  }

  async getFirstBlockAfter(start: number) {
    return this._blockModel.findOne({ number: { $gt: start } });
  }

  async getFirstGapsRange(): Promise<{ start: number; end: number } | null> {
    const checkedLen = await this.getGapsCheckedLen();
    let start = checkedLen;
    let end = await this.findMaxHeight();
    if (start === end) {
      return null;
    }
    let rangeCnt = await this.countInRange(start, end);
    if (rangeCnt >= end - start + 1) {
      return null;
    }
    // Binary search of first missed block
    while (start < end) {
      const mid = Math.floor(+start + (end - start) / 2);
      rangeCnt = await this.countInRange(start, mid);
      if (rangeCnt < mid - start + 1) {
        end = mid;
      } else {
        start = mid + 1;
      }
    }
    // Start - is the first missed block
    const nextBlock = await this.getFirstBlockAfter(start);
    return {
      start,
      end: nextBlock.number - 1,
    };
  }

  async setGapsChecked(height: number) {
    return this._blockModel.updateOne(
      { number: height },
      { $set: { gapsChecked: true } },
    );
  }
}
