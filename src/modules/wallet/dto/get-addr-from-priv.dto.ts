import { IsInt, IsNotEmpty } from 'class-validator';

export class GetAddrFromPrivDto {
  @IsNotEmpty()
  @IsInt()
  privKeyId: number;
}
