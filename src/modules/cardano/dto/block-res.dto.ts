import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { BlockSyncStatus } from '../../explorer/enums/block-sync-status';
import { TransactionResDto } from './transaction-res.dto';

export class BlockResDto {
  @IsInt()
  number: number;

  @IsInt()
  slotNo: number;

  @IsInt()
  epochNo: number;

  @IsInt()
  trxCount: number;

  @IsInt()
  size: number;

  @IsString()
  hash: string;

  @IsInt()
  timestamp: number;

  @IsString()
  @IsOptional()
  @IsEnum(BlockSyncStatus)
  syncStatus?: BlockSyncStatus;

  @IsInt()
  @IsOptional()
  checkAttempts?: number;

  @IsBoolean()
  @IsOptional()
  gapsChecked?: boolean;

  @ValidateNested({ each: true })
  @Type(() => TransactionResDto)
  transactions: TransactionResDto[];
}
