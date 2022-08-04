import { IsOptional, IsString } from 'class-validator';

interface IAddress {
  address: string;
  value: string;
}
export class TransactionRespDto {
  @IsString()
  txHash: string;

  @IsString()
  @IsOptional()
  txHex?: string;

  @IsString()
  @IsOptional()
  fee?: string;

  @IsOptional()
  @IsString()
  addressFrom?: IAddress[];

  @IsOptional()
  @IsString()
  addressTo?: IAddress[];

  @IsOptional()
  @IsString()
  timestamp?: string;

  @IsOptional()
  @IsString()
  amount?: string;

  @IsOptional()
  @IsString()
  symbol?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  height?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
