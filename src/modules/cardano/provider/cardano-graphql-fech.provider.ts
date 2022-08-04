/* eslint-disable @typescript-eslint/naming-convention */
import { Provider } from '@nestjs/common';
import fetch from 'isomorphic-fetch';

export const CARDANO_FETCH = Symbol('CARDANO_FETCH_PROVIDER');

export const CardanFetchProvider: Provider = {
  provide: CARDANO_FETCH,
  useValue: fetch,
};
