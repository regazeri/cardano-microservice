import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import * as config from 'config';

import {
  PrivKeyvalidateResDto,
  TransactionCreateDto,
  TransactionCreateRespDto,
  TransactionGetDto,
  TransactionGetEstimateFeeRespDto,
  TransactionGetHistoryDto,
  TransactionGetHistoryRespDto,
  TransactionRespDto,
  ValidateTxHashDto,
  ValidateTxHashRespDto,
} from '../dto';
import { TransactionService } from './../service/transaction.service';

@Controller('microservice')
export class TransactionController {
  constructor(private _transactionService: TransactionService) {}

  @MessagePattern({ cmd: `transaction.create.${config.coin.symbol as string}` })
  async createTransaction(
    input: TransactionCreateDto,
  ): Promise<TransactionCreateRespDto | PrivKeyvalidateResDto> {
    return await this._transactionService.createTransaction(input);
  }

  @MessagePattern({
    cmd: `transaction.history.${config.coin.symbol as string}`,
  })
  async getTransactionHistory(
    input: TransactionGetHistoryDto,
  ): Promise<TransactionGetHistoryRespDto> {
    return await this._transactionService.getTransactionHistory(input);
  }

  @MessagePattern({ cmd: `transaction.get.${config.coin.symbol as string}` })
  async getTransaction(input: TransactionGetDto): Promise<TransactionRespDto> {
    return await this._transactionService.getTransactionByHash(input.txHash);
  }

  @MessagePattern({
    cmd: `transaction.getEstimateFee.${config.coin.symbol as string}`,
  })
  async getEstimateFee(): Promise<TransactionGetEstimateFeeRespDto> {
    const { fee, unit } = await this._transactionService.getEstimateFee();
    return { unit, amount: fee };
  }

  @MessagePattern({
    cmd: `txHash.validate.${config.coin.symbol as string}`,
  })
  async validateTxHash(
    input: ValidateTxHashDto,
  ): Promise<ValidateTxHashRespDto> {
    return await this._transactionService.validateTxHash(input.txHash);
  }
}
