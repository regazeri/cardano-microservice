import { ICoinSelectionOutputs } from './coin-selection-output.interface';

export interface ICoinSelectionInputs extends ICoinSelectionOutputs {
  readonly hashID: string;
  readonly index: number;
}
