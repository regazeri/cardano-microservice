import { IsOptional, IsString } from 'class-validator';

export class WalletRespDto {
  @IsString()
  address: string;

  @IsString()
  privKey: string;

  @IsString()
  @IsOptional()
  pubKey?: string;

  @IsString()
  unit: string;
}
