import { IsString } from 'class-validator';

import { GetObservableWalletsResponseDto } from './get-observable-wallets-response.dto';

export class GetObservableWalletsRequestDto extends GetObservableWalletsResponseDto {
  @IsString()
  readonly symbol: string;
}
