import { IsNotEmpty, IsString } from 'class-validator';

export class TransactionGetEstimateFeeRespDto {
  @IsNotEmpty()
  @IsString()
  amount: string;

  @IsNotEmpty()
  @IsString()
  unit: string;
}
