import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ValidateAddressRespDto {
  @IsNotEmpty()
  @IsBoolean()
  isValid: boolean;
}
