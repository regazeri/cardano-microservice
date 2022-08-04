import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class TransactionCreateDto {
  @IsOptional()
  @IsString()
  addressFrom?: string;

  @IsNotEmpty()
  @IsString()
  addressTo: string;

  @IsNotEmpty()
  @IsString()
  amountCoins: string;

  @IsOptional()
  @IsNumber()
  sendersPrivKeyId?: number;
}
