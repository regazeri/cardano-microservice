import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { BalanceRespDto } from './balance-resp.dto';

export class WalletBulkUpdateBalancesDto {
  @ValidateNested({ each: true })
  @Type(() => BalanceRespDto)
  balances: BalanceRespDto[];
}
