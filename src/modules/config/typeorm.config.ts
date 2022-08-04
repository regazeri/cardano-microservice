import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as config from 'config';
import { readFileSync } from 'fs';

const dbConfig = config.secureKeyStorageDb;

export const secureKeyStorageDbConfig: TypeOrmModuleOptions = {
  name: 'secureKeyStorage',
  type: dbConfig.type,
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
  entities: [],
  synchronize: dbConfig.synchronize,
  keepConnectionAlive: true,
  ssl: dbConfig.sslOn
    ? {
        ca: readFileSync(dbConfig.ssl.ca, 'utf-8'),
        key: dbConfig.ssl.key ? readFileSync(dbConfig.ssl.key, 'utf-8') : null,
        cert: dbConfig.ssl.cert
          ? readFileSync(dbConfig.ssl.cert, 'utf-8')
          : null,
      }
    : null,
};
