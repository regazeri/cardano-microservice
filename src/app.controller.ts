import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import * as config from 'config';

@Controller()
export class AppController {
  @MessagePattern({ cmd: `ping.${config.coin.symbol as string}` })
  ping(): { pong: boolean } {
    return { pong: true };
  }
}
