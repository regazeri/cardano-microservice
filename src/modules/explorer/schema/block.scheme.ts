/* eslint-disable @typescript-eslint/naming-convention */
import * as mongoose from 'mongoose';

export const BlockSchema = new mongoose.Schema(
  {
    number: { type: Number, unique: true },
    slotNo: { type: Number, unique: true },
    epochNo: { type: Number, unique: true },
    trxCount: { type: Number },
    size: { type: Number },
    hash: { type: String, unique: true },
    timestamp: { type: Number },
    syncStatus: { type: String },
    checkAttempts: { type: Number },
    gapsChecked: { type: Boolean },
  },
  { strict: false },
)
  .index({ number: 1 }, { unique: true })
  .index({ hash: 1 }, { unique: true })
  .index({ timestamp: 1 })
  .index({ syncStatus: 1 }, { unique: false })
  .index({ checkAttempts: 1 }, { unique: false })
  .index({ gapsChecked: 1 }, { unique: false })
  .index({ epochNo: 1 });
