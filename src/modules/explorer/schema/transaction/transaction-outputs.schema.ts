/* eslint-disable @typescript-eslint/naming-convention */
import * as mongoose from 'mongoose';

export const TransactionOutputsSchema = new mongoose.Schema(
  {
    address: { type: String },
    index: { type: Number },
    txHash: { type: String },
    value: { type: String },
  },
  { strict: false },
);
