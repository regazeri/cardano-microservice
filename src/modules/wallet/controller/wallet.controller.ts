import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import * as config from 'config';

import {
  BalanceRespDto,
  GetAddrFromPrivDto,
  GetAddrFromPrivRespDto,
  ValidateAddressDto,
  ValidateAddressRespDto,
  WalletCreateDto,
  WalletGetBalanceDto,
  WalletRespDto,
} from '../dto';
import { PrivateKeyService } from './../../priv-key/service/priv-key.service';
import { WalletService } from './../service/wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(
    private _walletService: WalletService,
    private _privateKeyService: PrivateKeyService,
  ) {}

  @MessagePattern({
    cmd: `wallet.create.${config.coin.symbol as string}`,
  })
  async createWallet(_input: WalletCreateDto): Promise<WalletRespDto> {
    return this._walletService.createWallet();
  }
  @MessagePattern({
    cmd: `wallet.createMultiple.${config.coin.symbol as string}`,
  })
  async createMultipleWallets(input: {
    qty: number;
  }): Promise<{ wallets: WalletRespDto[] }> {
    const { qty } = input;
    const wallets = await this._walletService.createMultipleWallets(qty);
    return {
      wallets,
    };
  }

  @MessagePattern({
    cmd: `wallet.getbalance.${config.coin.symbol as string}`,
  })
  async getWalletBalance(input: WalletGetBalanceDto): Promise<BalanceRespDto> {
    return await this._walletService.getAccountBalance(input);
  }

  @MessagePattern({
    cmd: `wallet.getAddrFromPriv.${config.coin.symbol as string}`,
  })
  async getAddrFromPrivateKey(
    input: GetAddrFromPrivDto,
  ): Promise<GetAddrFromPrivRespDto> {
    const { privKey } = await this._privateKeyService.getById(input.privKeyId);
    return await this._walletService.getAddrFromPrivateKey({ privKey });
  }

  @MessagePattern({
    cmd: `address.validate.${config.coin.symbol as string}`,
  })
  async validateAddress(
    input: ValidateAddressDto,
  ): Promise<ValidateAddressRespDto> {
    return await this._walletService.validateAddress(input.address);
  }
}
