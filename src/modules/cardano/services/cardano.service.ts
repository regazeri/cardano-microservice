import type {
  Address,
  Bip32PrivateKey,
  PrivateKey,
  Transaction,
  TransactionBody,
} from '@emurgo/cardano-serialization-lib-nodejs';
import { Inject, Injectable } from '@nestjs/common';
import * as config from 'config';

import { paymentPath, stakePath } from '../constant';
import {
  AccountResDto,
  BlockResDto,
  CoinSelectionDto,
  TransactionResDto,
} from '../dto';
import { ICoinSelectionInputs, ICoinSelectionOutputs } from '../interface';
import { CARDANO_BIP39 } from '../provider/cardano-bip-provider';
import { CARDANO_WASM } from '../provider/cardano-wasm-provider';
import { CardanoGraphqlService } from './cardano-graphql.service';

declare type CardanoWasm =
  typeof import('@emurgo/cardano-serialization-lib-nodejs');
declare type BIP39 = typeof import('bip39');

const phrasesLengthMap: { [key: number]: number } = {
  12: 128,
  15: 160,
  18: 192,
  21: 224,
  24: 256,
};
@Injectable()
export class CardanoService {
  private readonly _purpose = config.coin.cardanoPurpose;
  private readonly _coinType = config.coin.cardanoCoinType;
  private readonly _accountIndex = 0;

  constructor(
    @Inject(CARDANO_WASM) public readonly cardanoWasm: CardanoWasm,
    @Inject(CARDANO_BIP39) public readonly bip39: BIP39,
    private readonly _cardanoApi: CardanoGraphqlService,
  ) {}

  generateSeedPhrase(size = 15): string {
    const strength = phrasesLengthMap[size] || phrasesLengthMap[15];
    return this.bip39.generateMnemonic(strength).trim();
  }

  deriveRootKey(phrase: string | string[]): Bip32PrivateKey {
    const mnemonic = Array.isArray(phrase) ? phrase.join(' ') : phrase;
    const entropy = this.bip39.mnemonicToEntropy(mnemonic);
    return this.cardanoWasm.Bip32PrivateKey.from_bip39_entropy(
      Buffer.from(entropy, 'hex'),
      Buffer.from(''),
    );
  }

  deriveAccountKeyPath(key: Bip32PrivateKey): Bip32PrivateKey {
    return key
      .derive(this._harden(this._purpose))
      .derive(this._harden(this._coinType))
      .derive(this._harden(this._accountIndex));
  }

  deriveKey(key: Bip32PrivateKey, keyPath: string[]): Bip32PrivateKey {
    let result = key;
    keyPath.forEach(path => {
      result = result.derive(
        path.endsWith('H') || path.endsWith("'")
          ? this._harden(Number.parseInt(path.substr(0, path.length - 1), 10))
          : Number.parseInt(path, 10),
      );
    });
    return result;
  }
  derivePrivateKeys(): any {
    const phrase = this.generateSeedPhrase();
    const rootKey = this.deriveRootKey(phrase);
    const accountKey = this.deriveAccountKeyPath(rootKey);
    const paymentPrivKey = this.deriveKey(rootKey, paymentPath).to_raw_key();
    const stakePrivKey = this.deriveKey(rootKey, stakePath).to_raw_key();
    return { accountKey, paymentPrivKey, stakePrivKey };
  }

  derivePaymentAddress(
    paymentPrivKey: PrivateKey,
    stakePrivKey: PrivateKey,
  ): Address {
    const paymentPubKey = paymentPrivKey.to_public();
    const stakePubKey = stakePrivKey.to_public();
    const netWorkId =
      config.coin.netWorkTag === 'testnet'
        ? this.cardanoWasm.NetworkInfo.testnet().network_id()
        : this.cardanoWasm.NetworkInfo.mainnet().network_id();
    return this.cardanoWasm.BaseAddress.new(
      netWorkId,
      this.cardanoWasm.StakeCredential.from_keyhash(paymentPubKey.hash()),
      this.cardanoWasm.StakeCredential.from_keyhash(stakePubKey.hash()),
    ).to_address();
  }
  private _harden(num: number): number {
    return 0x80000000 + num;
  }

  deriveStakeAddress(stakePrivKey: PrivateKey): Address {
    const stakePubKey = stakePrivKey.to_public();
    const netWorkId =
      config.coin.netWorkTag === 'testnet'
        ? this.cardanoWasm.NetworkInfo.testnet().network_id()
        : this.cardanoWasm.NetworkInfo.mainnet().network_id();
    return this.cardanoWasm.RewardAddress.new(
      netWorkId,
      this.cardanoWasm.StakeCredential.from_keyhash(stakePubKey.hash()),
    ).to_address();
  }
  createAccount(): AccountResDto {
    const { paymentPrivKey, stakePrivKey } = this.derivePrivateKeys();
    const walletAddress = this.derivePaymentAddress(
      paymentPrivKey,
      stakePrivKey,
    ).to_bech32();
    const stakeAddress = this.deriveStakeAddress(stakePrivKey).to_bech32();
    return {
      walletAddress,
      privKey: paymentPrivKey.to_bech32(),
    };
  }

  buildTransaction(
    coinSelection: CoinSelectionDto,
    ttl: number,
    configs: any,
    changeAddress?: string,
  ): TransactionBody {
    const startSlot = 0;

    //  1-instantiate the tx builder with the Cardano protocol parameters
    const txBuilder = this.cardanoWasm.TransactionBuilder.new(
      this.cardanoWasm.LinearFee.new(
        this.cardanoWasm.BigNum.from_str(
          configs.protocolParams.minFeeA.toString(),
        ),
        this.cardanoWasm.BigNum.from_str(
          configs.protocolParams.minFeeB.toString(),
        ),
      ),
      // minimum utxo value
      this.cardanoWasm.BigNum.from_str(
        configs.protocolParams.minUTxOValue.toString(),
      ),
      // pool deposit
      this.cardanoWasm.BigNum.from_str(
        configs.protocolParams.poolDeposit.toString(),
      ),
      // key deposit
      this.cardanoWasm.BigNum.from_str(
        configs.protocolParams.keyDeposit.toString(),
      ),
    );
    // 2-add tx inputs
    coinSelection.inputs.forEach(input => {
      const { address, txInput, amount } = this.addTxInput(input);
      txBuilder.add_input(address, txInput, amount);
    });
    // 3- add tx outputs
    coinSelection.outputs.forEach(output => {
      const txOutput = this.addOutputTransaction(output);
      txBuilder.add_output(txOutput);
    });

    // 4- add tx change
    // if it needs to transfer funds to the other public address,here we can put changeAddress

    // 5-check for metadata and add to transaction if it needs
    // 6-set tx validity start interval
    txBuilder.set_validity_start_interval(startSlot);
    // 6-set tx ttl
    txBuilder.set_ttl(ttl);
    // 7-set fee
    if (changeAddress) {
      const address = this.cardanoWasm.Address.from_bech32(changeAddress);
      txBuilder.add_change_if_needed(address);
    } else {
      const fee =
        coinSelection.inputs.reduce((acc, c) => Number(c.amount) + acc, 0) -
        coinSelection.outputs.reduce((acc, c) => Number(c.amount) + acc, 0);
      txBuilder.set_fee(this.cardanoWasm.BigNum.from_str(fee.toString()));
    }

    return txBuilder.build();
  }
  addTxInput(input: ICoinSelectionInputs) {
    const address = this.cardanoWasm.Address.from_bech32(input.address);
    const txInput = this.cardanoWasm.TransactionInput.new(
      this.cardanoWasm.TransactionHash.from_bytes(
        Buffer.from(input.hashID, 'hex'),
      ),
      input.index,
    );
    const amount = this.cardanoWasm.Value.new(
      this.cardanoWasm.BigNum.from_str(input.amount),
    );
    return { address, txInput, amount };
  }

  addOutputTransaction(output: ICoinSelectionOutputs) {
    const address = this.cardanoWasm.Address.from_bech32(output.address);
    const amount = this.cardanoWasm.Value.new(
      this.cardanoWasm.BigNum.from_str(output.amount),
    );
    // add tx assets
    // we can add assets here if it needs
    return this.cardanoWasm.TransactionOutput.new(address, amount);
  }

  getTransactionFee(tx: Transaction, configs: any) {
    return this.cardanoWasm.min_fee(
      tx,
      this.cardanoWasm.LinearFee.new(
        this.cardanoWasm.BigNum.from_str(
          configs.protocolParams.minFeeA.toString(),
        ),
        this.cardanoWasm.BigNum.from_str(
          configs.protocolParams.minFeeB.toString(),
        ),
      ),
    );
  }

  signTrx(txBody: TransactionBody, prvKey: string): Transaction {
    const privateKey =
      this.cardanoWasm.Bip32PrivateKey.from_bech32(prvKey).to_raw_key();
    const txHash = this.cardanoWasm.hash_transaction(txBody);
    const witnesses = this.cardanoWasm.TransactionWitnessSet.new();
    const vkeyWitnesses = this.cardanoWasm.Vkeywitnesses.new();
    const vkeyWitness = this.cardanoWasm.make_vkey_witness(txHash, privateKey);
    vkeyWitnesses.add(vkeyWitness);
    witnesses.set_vkeys(vkeyWitnesses);
    return this.cardanoWasm.Transaction.new(txBody, witnesses);
  }

  async submitTx(tx: string): Promise<string> {
    return await this._cardanoApi.submitTransaction(tx);
  }

  async getCurrentBlockchainHeight(): Promise<number> {
    const blockData = await this._cardanoApi.getNetworkTip();
    return blockData.cardano.tip.number;
  }
  async getBlocksInRange(start: number, end: number): Promise<BlockResDto[]> {
    const blockNumbers = Array(end - start + 1)
      .fill(null)
      .map((_, idx) => start + idx);

    const blocks = await this._cardanoApi.getBlockWithTransactions(
      blockNumbers,
    );
    return this.blockAndTrxCustomizeHandler(blocks);
  }

  async getTransactionFromBlock(
    blockNumber: number,
  ): Promise<TransactionResDto[]> {
    const block = await this.getBlocksInRange(blockNumber, blockNumber);
    return block[0].transactions;
  }

  blockAndTrxCustomizeHandler(blocks: any): BlockResDto[] {
    return blocks.map(block => ({
      number: block.number,
      slotNo: block.slotNo,
      epochNo: block.epochNo,
      trxCount: block.transactionsCount,
      size: block.size,
      hash: block.hash,
      timestamp: +new Date(block.forgedAt),
      transactions: block.transactions.map(trx => ({
        txId: trx.hash,
        block: block.number,
        fees: trx.fee,
        size: trx.size,
        inputs: trx.inputs,
        outputs: trx.outputs,
        totalOutput: trx.totalOutput,
        timestamp: +new Date(trx.includedAt),
      })),
    }));
  }
  async getBalance(address: string): Promise<string> {
    const output = await this._cardanoApi.getAddressBalance([...address]);
    return output.paymentAddresses[0].summary.assetBalances[0].quantity;
  }
  async getInputsAccountData(address: string): Promise<any> {
    const inputs = await this._cardanoApi.getUtxoData(address);
    return inputs.utxos.map(input => ({
      index: input.index,
      hashID: input.txHash,
    }));
  }

  async calculateTtl(): Promise<number> {
    const offsetTtl = 10 * 60 * 2; // 10minutes * 60 seconds *2=1200
    const blockData = await this._cardanoApi.getNetworkTip();
    return +blockData.cardano.tip.slotNo + offsetTtl;
  }
  async getTransactionByHash(hashID: string): Promise<any> {
    const transactions = await this._cardanoApi.getTransactionByHash(hashID);
    return {
      txHash: transactions[0].hash


