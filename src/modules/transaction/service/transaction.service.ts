import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { isDefined } from 'class-validator';
import * as config from 'config';
import { log } from 'console';
import { lastValueFrom } from 'rxjs';

import { CoinSelectionDto } from '../../cardano/dto';
import { CardanoService } from '../../cardano/services/cardano.service';
import { TransactionRepository } from '../../explorer/repositories/transaction.repository';
import { PrivateKeyService } from '../../priv-key/service/priv-key.service';
import { WalletService } from '../../wallet/service/wallet.service';
import {
  InspectRecentlyAddedToBlockTxsDto,
  TransactionCreateDto,
  TransactionCreateRespDto,
  TransactionGetHistoryDto,
  TransactionGetHistoryRespDto,
  TransactionRespDto,
  ValidateTxHashRespDto,
} from '../dto';
import { netConfig } from './../../cardano/config/shelly-network';

@Injectable()
export class TransactionService {
  private _logger = new Logger(TransactionService.name);

  private readonly _unit = config.coin.unit as string;
  private readonly _symbol = config.coin.symbol as string;
  private readonly _network = config.coin.netWorkTag as string;
  constructor(
    @Inject('TRANSACTION')
    private _natsConnection: ClientProxy,
    private _privateKeyService: PrivateKeyService,
    private _walletService: WalletService,
    private _cardanoService: CardanoService,
    private _transactionRepository: TransactionRepository,
  ) {}

  async createTransaction(
    input: TransactionCreateDto,
  ): Promise<TransactionCreateRespDto | { isPrivKeyValid: boolean }> {
    try {
      let privKey: string;
      let coinSelection: CoinSelectionDto;
      if (Number.isInteger(input.sendersPrivKeyId) === true) {
        privKey = (
          await this._privateKeyService.getById(input.sendersPrivKeyId)
        ).privKey;
        const getAddrResults = await this._walletService.getAddrFromPrivateKey({
          privKey,
        });

        if (getAddrResults.isPrivKeyValid === false) {
          return {
            isPrivKeyValid: false,
          };
        }

        input.addressFrom = getAddrResults.address;
      } else {
        privKey = (
          await this._privateKeyService.getByAddress(input.addressFrom)
        ).privKey;
      }
      if (+input.amountCoins < 5) {
        throw new BadRequestException('amountCoins must be at least 5 ADA');
      }

      // 1-get from utxo inputs and hash and index
      coinSelection.inputs = await this._cardanoService.getInputsAccountData(
        input.addressFrom,
      );
      // 2- calculate ttl
      const ttl = await this._cardanoService.calculateTtl();
      // 3-check for mainnet or testnet and add config
      const net =
        this._network === 'mainnet' ? netConfig.Mainnet : netConfig.testnet;
      // 4- calc output addresses//TODO check for lovelace multiple
      coinSelection.outputs = [
        { address: input.addressTo, amount: input.amountCoins },
      ];
      // 5-build transaction
      // in our case changeAddress is addressFrom but we can provide another used or unused address
      const trxBody = this._cardanoService.buildTransaction(
        coinSelection,
        ttl,
        net,
        input.addressFrom,
      );
      //  6-sign
      const sign = this._cardanoService.signTrx(trxBody, privKey);
      // 7- submit on blockChain
      const signed = Buffer.from(sign.to_bytes()).toString('hex');
      const txHash = await this._cardanoService.submitTx(signed);
      return {
        txHash,
        addressFrom: input.addressFrom,
        addressTo: input.addressTo,
        amount: input.amountCoins.toString(),
        fee: 'have not yet provided',
        symbol: this._symbol,
        timestamp: new Date().toISOString(),
        txHex: 'have not yet provided',
        unit: this._unit,
      };
    } catch (err) {
      console.error(err);
      throw new Error(err);
    }
  }

  async getTransactionByHash(hash: string): Promise<TransactionRespDto> {
    const dbTx = await this._transactionRepository.getTxByHash(hash);
    if (isDefined(dbTx)) {
      const addressesFrom = dbTx.inputs.map(input => ({
        address: input.address,
        value: input.value,
      }));
      const addressesTo = dbTx.outputs.map(output => ({
        address: output.address,
        value: output.value,
      }));

      return {
        txHash: dbTx.txId,
        addressFrom: addressesFrom,
        addressTo: addressesTo,
        unit: this._unit,
        amount: parseInt(dbTx.totalOutput, 10).toString(),
        symbol: this._symbol,
        fee: dbTx.fees,
        timestamp: new Date(dbTx.timestamp || 0).toISOString(),
        height: dbTx.block,
        status: dbTx.status,
      };
    }
    const tx = await this._cardanoService.getTransactionByHash(hash);

    if (!isDefined(tx)) {
      throw new NotFoundException(
        'TransactionService',
        `Transaction by hash: ${hash} not found`,
      );
    }
    return { ...tx, status: 'Success', symbol: this._symbol, unit: this._unit };
  }
  async getTransactionHistory(
    input: TransactionGetHistoryDto,
  ): Promise<TransactionGetHistoryRespDto> {
    const { page, pageSize, order, orderBy, address, search } = input;

    const orderKey = orderBy || 'height';
    const orderVal = order === 1 ? 'asc' : 'desc';

    const sort = {
      [orderKey]: orderVal,
    };

    const options = {
      page,
      sort,
      limit: pageSize,
      lean: true,
    };

    try {
      const result = await this._transactionRepository.getTxsForAddress(
        address,
        options,
        search,
      );

      return {
        txs: result.docs.map(tx => ({
          txHash: tx.txId,
          addressFrom: tx.inputs.inputs.map(inputVal => ({
            address: inputVal.address,
            value: inputVal.value,
          })),
          addressTo: tx.outputs.map(output => ({
            address: output.address,
            value: output.value,
          })),
          unit: this._unit,
          amount: parseInt(tx.totalOutput, 10).toString(),
          symbol: this._symbol,
          fee: tx.fees,
          timestamp: new Date(tx.timestamp || 0).toISOString(),
          height: tx.block,
          status: tx.status,
        })),
        currentPage: result.page,
        nextPage: result.hasNextPage ? result.nextPage : null,
        pageSize: result.limit,
        totalPages: result.totalPages,
        totalRecords: result.totalDocs,
      };
    } catch (err) {
      log('getTransactionHistory/error: ', err);
      throw new Error(err);
    }
  }
  async sendRecentTxsToServiceCore(
    dto: InspectRecentlyAddedToBlockTxsDto,
  ): Promise<any> {
    try {
      const transactions$ = this._natsConnection.emit(
        `transaction.inspectRecentlyAddedToBlock.${this._symbol}`,
        dto,
      );
      return await lastValueFrom(transactions$);
    } catch (err) {
      log('sendRecentTxsToServiceCore/error: ', err);
      throw err;
    }
  }
  async getEstimateFee(
  ): Promise<{ fee: string; unit: string }> {}
  async validateTxHash(txHash: string): Promise<ValidateTxHashRespDto> {}
}
