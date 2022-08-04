import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class BlockNewDto {
  @IsNotEmpty()
  @IsNumber()
  height: number;

  @IsNotEmpty()
  @IsString()
  blockTimestamp: string;
}
