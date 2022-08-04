export interface IInputTransaction {
  readonly address: string;
  readonly sourceTxHash: string;
  readonly sourceTxIndex: number;
  readonly value: string;
}
