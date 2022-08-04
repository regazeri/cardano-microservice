import { IsInt, IsString } from 'class-validator';

import { IInputTransaction, IOutputTransaction } from '../interface';

export class TransactionResDto {
  @IsInt()
  txId: number;

  @IsInt()
  block: number;

  @IsString()
  fees: string;

  inputs: IInputTransaction[];
  outputs: IOutputTransaction[];

  @IsInt()
  size: number;

  @IsString()
  totalOutput: string;

  @IsInt()
  timestamp: number;
}
