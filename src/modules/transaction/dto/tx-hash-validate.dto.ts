import { IsNotEmpty, IsString } from 'class-validator';

export class ValidateTxHashDto {
  @IsNotEmpty()
  @IsString()
  txHash: string;
}
