import { IsNotEmpty, IsString } from 'class-validator';

export class ValidateAddressDto {
  @IsNotEmpty()
  @IsString()
  address: string;
}
