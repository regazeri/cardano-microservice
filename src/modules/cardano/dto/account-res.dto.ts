import { IsString } from 'class-validator';

export class AccountResDto {
  @IsString()
  privKey: string;

  @IsString()
  walletAddress: string;
}
