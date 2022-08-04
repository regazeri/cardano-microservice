import { IsNotEmpty, IsString } from 'class-validator';

export class TransactionGetDto {
  @IsNotEmpty()
  @IsString()
  txHash: string;
}
