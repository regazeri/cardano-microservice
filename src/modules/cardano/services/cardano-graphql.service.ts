import { Inject, Injectable } from '@nestjs/common';
import * as config from 'config';

import { IUtxoResponsDto } from '../interface';
import { CARDANO_FETCH } from '../provider/cardano-graphql-fech.provider';

declare type Fetch = typeof import('isomorphic-fetch');
const url = config.coin.node;
@Injectable()
export class CardanoGraphqlService {
  constructor(@Inject(CARDANO_FETCH) public readonly graphQlApi: Fetch) {}

  async getUtxoData(address: string): Promise<IUtxoResponsDto> {
    const result = await this.graphQlApi.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query Utxos (
        $address: String!
      ){
        utxos(
            order_by: { address: desc }
            where: { address: { _eq: $address }}
        )  {
          txHash
          index
          value
        }    
      }`,
        variables: { address },
      }),
    });
    const res = await result.json();
    return res.data;
  }

  async getAddressBalance(addresses: string[]): Promise<any> {
    const result = await this.graphQlApi.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query  PaymentAddresses (
                  $addresses: [String]!
                ){
          paymentAddresses(
            addresses: $addresses 
          )  {
            address 
              summary{
              utxosCount
                assetBalances{
                  quantity
                }
              }
          }    
        }`,
        variables: { addresses },
      }),
    });
    const res = await result.json();
    return res.data;
  }
  async getNetworkTip(): Promise<any> {
    const result = await this.graphQlApi.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query { cardano { tip { number slotNo epoch { number } } } }
      `,
      }),
    });
    const res = await result.json();
    return res.data;
  }
  async submitTransaction(trx: string): Promise<string> {
    const result = await this.graphQlApi.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mutation: `mutation submitTransaction(
          $trx: String!
      ) {
          submitTransaction(transaction: $trx) {
              hash
          }
      }`,
        variables: { trx },
      }),
    });
    const res = await result.json();
    return res.data;
  }
  async getBlockInfo(numbers: number[]): Promise<any> {
    const result = await this.graphQlApi.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query blockByNumber(
          $numbers: [Int!]!
      )  {
          blocks (
              where: {
                  number: {
                      _in: $numbers
                  }
              },
              order_by: {
                  number: asc
              }
          ) {
              epoch {
                  number
              }
              epochNo
              fees
              hash
              number
              forgedAt
              slotLeader {
                  description
              }
              previousBlock {
                  hash
                  number
              }
      
              nextBlock {
                  hash
                  number
              }
              size
              slotNo
              transactionsCount
          }
      }`,
        variables: { numbers },
      }),
    });
    const res = await result.json();
    return res.data;
  }
  async getBlockWithTransactions(blockNumber: number[]): Promise<any> {
    const result = await this.graphQlApi.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query blockByNumber(
          $blockNumber: [Int!]!
      )  {
          blocks (
              where: {
                  number: {
                      _in: $blockNumber
                  }
              },
              order_by: {
                  number: asc
              }
          ) {
              epoch {
                  number
              }
              epochNo
              fees
              hash
              number
              forgedAt
              previousBlock {
                  hash
                  number
              }
      
              nextBlock {
                  hash
                  number
              }
              size
              slotNo
              transactionsCount
              transactions(
                       order_by: { hash: desc }
                     ) {
                      hash
                      totalOutput
                      size
                      fee
                      includedAt
                         inputs(order_by: { sourceTxHash: asc }) {
                             address
                             sourceTxIndex
                             sourceTxHash
                             value
                         }
                         inputs_aggregate {
                             aggregate {
                                 sum {
                                     value
                                 }
                             }
                         }
                         outputs(order_by: { index: asc }) {
                             index
                             address
                             txHash
                             value
                         }

      }
             fees
              hash
              number
              forgedAt
              size
              slotNo
              transactionsCount
          }
      }`,
        variables: { blockNumber },
      }),
    });
    const res = await result.json();
    return res.data.blocks;
  }
  async getTransactionByHash(hashID: string): Promise<any> {
    const result = await this.graphQlApi.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query transactionsByHashes(
          $hashID: Hash32Hex!
      ) {
          transactions(
              where: { hash: { _eq: $hashID }},
              order_by: { hash: desc }
          ) {
              block {
                  number
              }
              fee
              includedAt
              totalOutput
              inputs(order_by: { sourceTxHash: asc }) {
                  address
                  value
              }
              outputs(order_by: { index: asc }) {
                  address
                  value
              }
          }
      }`,
        variables: { hashID },
      }),
    });
    const res = await result.json();
    return res.data;
  }
}
