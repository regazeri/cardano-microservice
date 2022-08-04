import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class TransactionCreateRespDto {
  @IsNotEmpty()
  @IsString()
  txHash: string;

  @IsOptional()
  @IsString()
  txHex: string;

  @IsNotEmpty()
  @IsString()
  addressFrom: string;

  @IsNotEmpty()
  @IsString()
  addressTo: string;

  @IsNotEmpty()
  @IsDateString()
  timestamp: string;

  @IsNotEmpty()
  @IsString()
  amount: string;

  @IsNotEmpty()
  @IsString()
  fee: string;

  @IsNotEmpty()
  @IsString()
  unit: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(5)
  symbol: string;
}
