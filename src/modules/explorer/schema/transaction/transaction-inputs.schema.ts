/* eslint-disable @typescript-eslint/naming-convention */
import * as mongoose from 'mongoose';

export const TransactionInputsSchema = new mongoose.Schema(
  {
    address: { type: String },
    sourceTxHash: { type: String },
    sourceTxIndex: { type: Number },
    value: { type: String },
  },
  { strict: false },
);
