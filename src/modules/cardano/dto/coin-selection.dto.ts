import { ICoinSelectionInputs, ICoinSelectionOutputs } from '../interface';

export class CoinSelectionDto {
  inputs: ICoinSelectionInputs[];
  outputs: ICoinSelectionOutputs[];
  metadata?: any;
}
