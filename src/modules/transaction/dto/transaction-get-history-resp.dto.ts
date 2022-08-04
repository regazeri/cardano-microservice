import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, ValidateNested } from 'class-validator';
import { TransactionRespDto } from './transaction-resp.dto';

// import { ITransaction } from '../interface';

export class TransactionGetHistoryRespDto {
  @IsNotEmpty()
  @IsInt()
  currentPage: number;

  @IsNotEmpty()
  @IsInt()
  nextPage: number;

  @IsNotEmpty()
  @IsInt()
  pageSize: number;

  @IsNotEmpty()
  @IsInt()
  totalPages: number;

  @IsNotEmpty()
  @IsInt()
  totalRecords: number;

  @ValidateNested({ each: true })
  @Type(() => TransactionRespDto)
  txs: TransactionRespDto[];
}
