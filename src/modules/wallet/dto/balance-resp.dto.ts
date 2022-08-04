import { IsNumber, IsOptional, IsString } from 'class-validator';
// TODO change amount to string
export class BalanceRespDto {
  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  address?: string;

  @IsOptional()
  @IsString()
  unit?: string;
}
