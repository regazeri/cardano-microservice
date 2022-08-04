export interface IUtxoDto {
  readonly txHash: string;
  readonly index: number;
  readonly value: string;
}

export interface IUtxoResponsDto {
  readonly utxos: IUtxoDto[];
}
