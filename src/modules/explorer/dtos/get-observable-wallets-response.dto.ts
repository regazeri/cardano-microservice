import { IsArray } from 'class-validator';

export class GetObservableWalletsResponseDto {
  @IsArray()
  readonly addresses: string[];
}
