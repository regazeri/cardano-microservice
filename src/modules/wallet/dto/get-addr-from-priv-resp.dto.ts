import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class GetAddrFromPrivRespDto {
  @IsNotEmpty()
  @IsBoolean()
  isPrivKeyValid: boolean;

  @IsNotEmpty()
  @IsString()
  address?: string;
}
