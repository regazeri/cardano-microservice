/* eslint-disable @typescript-eslint/naming-convention */
import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';
import { Provider } from '@nestjs/common';

export const CARDANO_WASM = Symbol('CARDANO_WASM_PROVIDER');

export const CardanoWasmProvider: Provider = {
  provide: CARDANO_WASM,
  useValue: CardanoWasm,
};
