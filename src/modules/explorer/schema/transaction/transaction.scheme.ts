/* eslint-disable @typescript-eslint/naming-convention */
import * as mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

import { TransactionInputsSchema } from './transaction-inputs.schema';
import { TransactionOutputsSchema } from './transaction-outputs.schema';

export const TransactionSchema = new mongoose.Schema(
  {
    txId: { type: String, unique: true },
    block: { type: Number },
    fees: { type: String },
    inputs: { type: [TransactionInputsSchema] },
    outputs: { type: [TransactionOutputsSchema] },
    size: { type: Number },
    totalOutput: { type: String },
    status: { type: String },
    timestamp: { type: Number },
  },
  { strict: false },
)
  .index({ txId: 1 })
  .index({ block: 1 })
  .index({ timestamp: 1 })
  .index({ 'inputs.address': 1 })
  .index({ 'inputs.sourceTxHash': 1 })
  .index({ 'outputs.address': 1 })
  .index({ timestamp: 1 })
  .plugin(mongoosePaginate);
