/* eslint-disable @typescript-eslint/naming-convention */
import { Provider } from '@nestjs/common';
import * as bip39 from 'bip39';

export const CARDANO_BIP39 = Symbol('CARDANO_BIP39_PROVIDER');

export const CardanBIP39Provider: Provider = {
  provide: CARDANO_BIP39,
  useValue: bip39,
};
