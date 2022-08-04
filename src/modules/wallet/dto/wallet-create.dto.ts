import { IsString } from 'class-validator';

export class WalletCreateDto {
  @IsString()
  symbol: string;
}
