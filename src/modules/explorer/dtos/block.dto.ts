import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

import { BlockSyncStatus } from '../enums/block-sync-status';

export class BlockDto {
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
}
