import { Injectable } from '@nestjs/common';
import { PrivKey } from '../entity/priv-key.entity';

@Injectable()
export class PrivateKeyService {
  constructor() {}

  async getByAddress(address: string): Promise<PrivKey> {}

  async getById(id: number): Promise<PrivKey> {}
}
