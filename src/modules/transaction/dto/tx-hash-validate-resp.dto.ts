import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ValidateTxHashRespDto {
  @IsNotEmpty()
  @IsBoolean()
  isValid: boolean;
}
