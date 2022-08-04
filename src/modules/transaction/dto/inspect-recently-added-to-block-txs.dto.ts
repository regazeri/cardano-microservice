import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class InspectRecentlyAddedToBlockTxsDto {
  @IsNotEmpty()
  @IsArray()
  txHashes: string[];

  @IsNotEmpty()
  @IsString()
  blockTimestamp: string;

  @IsNotEmpty()
  @IsNumber()
  blockHeight: number;
}
