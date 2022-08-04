import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  RequestTimeoutException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import * as config from 'config';
import { lastValueFrom, timeout, TimeoutError } from 'rxjs';

import {
  GetObservableWalletsRequestDto,
  GetObservableWalletsResponseDto,
} from '../../explorer/dtos';
import {
  BalanceRespDto,
  GetAddrFromPrivRespDto,
  ValidateAddressRespDto,
  WalletBulkUpdateBalancesDto,
  WalletGetBalanceDto,
  WalletRespDto,
} from '../dto';
import { CardanoService } from './../../cardano/services/cardano.service';

@Injectable()
export class WalletService {
  private _logger = new Logger('WalletService');
  private readonly _unit = config.coin.unit as string;
  private readonly _timeout = config.server.timeout as number;
  private readonly _symbol = config.coin.symbol as string;

  constructor(
    private _cardanoService: CardanoService,
    @Inject('WALLET')
    private _natsConnection: ClientProxy,
  ) {}
  async createWallet(): Promise<WalletRespDto> {
    const account = this._cardanoService.createAccount();
    return {
      address: account.walletAddress,
      privKey: account.privKey,
      unit: this._unit,
    };
  }

  async createMultipleWallets(qty: number): Promise<WalletRespDto[]> {
    const wallets: WalletRespDto[] = [];
    for (let i = 0; i < qty; i++) {
      const wallet = await this.createWallet();
      wallets.push(wallet);
    }
    return wallets;
  }

  async getAccountBalance(input: WalletGetBalanceDto): Promise<BalanceRespDto> {
    const balanceData = await this._cardanoService.getBalance(input.address);
    return {
      amount: parseInt(balanceData.toString(), 10),
      unit: this._unit,
      address: input.address,
    };
  }

  async getAddrFromPrivateKey(input: {
    privKey: string;
  }): Promise<GetAddrFromPrivRespDto> {
    
  }

  async validateAddress(_address: string): Promise<ValidateAddressRespDto> {}

  async getObservableByServiceCoreWallets(
    dto: GetObservableWalletsRequestDto,
  ): Promise<GetObservableWalletsResponseDto> {
    try {
      const wallets$ = this._natsConnection
        .send(
          {
            cmd: 'wallet.getObservable',
          },
          dto,
        )
        .pipe(timeout(this._timeout));
      return await lastValueFrom(wallets$);
    } catch (error) {
      console.error('getObservableByServiceCoreWallets/error: \n', error);
      if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      }
      throw new InternalServerErrorException(error);
    }
  }

  async sendWalletBalancesUpdate(
    dto: WalletBulkUpdateBalancesDto,
  ): Promise<any> {
    const balances$ = this._natsConnection.emit(
      `wallet.bulkUpdateBalances.${this._symbol}`,
      dto,
    );
    return await lastValueFrom(balances$);
  }
}
