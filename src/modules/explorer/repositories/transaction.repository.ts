/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

import { TransactionDto } from '../dtos';

@Injectable()
export class TransactionRepository {
  constructor(
    @InjectModel('Transaction') private readonly _txModel: mongoose.Model<any>,
  ) {}
  async createMultiple(transactions: TransactionDto[]): Promise<any> {
    return this._txModel
      .insertMany(transactions)
      .catch(err => console.error(`ERROR: ${err}`))
      .then(value => value);
  }
  async getByHeight(height: number): Promise<any[]> {
    return this._txModel.find({ block: height });
  }

  async getTxByHash(txID: string): Promise<any> {
    return this._txModel.findOne({ txID }).exec();
  }

  async getTxsForAddress(
    address: string,
    options: any,
    search?: string,
  ): Promise<any> {
    const addressFilter = {
      $or: [{ 'outputs.address': address }, { 'inputs.address': address }],
    };

    const searchFilter = search
      ? {
          $or: [
            { txId: search },
            { 'outputs.address': search },
            { 'inputs.address': search },
          ],
        }
      : null;

    const filter = searchFilter
      ? { $and: [searchFilter, addressFilter] }
      : addressFilter;

    return (this._txModel as any).paginate(filter, options);
  }
}
