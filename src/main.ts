import dotenv from 'dotenv';
dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || '../.env' });
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as config from 'config';
import { error, log } from 'console';

import { AppModule } from './app.module';

const serverConfig = config.server;
const natsInternalConfig = config.NATSInternal;
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: [natsInternalConfig.url],
    },
  });
  void app.startAllMicroservices();
  await app.listen(serverConfig.port || 8100, '0.0.0.0');
  log(`Application is running on: ${await app.getUrl()}`);
  log(`Cardano node on: ${config.coin.node as string}`);
}
bootstrap().catch(err => error('something went wrong!', { err }));
