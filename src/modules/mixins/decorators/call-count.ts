/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/tslint/config */
import 'reflect-metadata';

import { Logger } from '@nestjs/common';

import { LOGGER } from './set-logger';

const CALL_COUNT = Symbol('CALL_COUNT');
const LAST_PERIOD = Symbol('LAST_PERIOD');
const CHUNK_SIZE = Symbol('CHUNK_SIZE');

type stringFn = () => string;

const knownPeriods = {
  daily: () => {
    const date = new Date();
    return `${date.getFullYear()}-${date.getDate()}-${date.getMonth()}`;
  },
  second: () => Math.floor(Date.now() / 100).toString(10),
  infinite: () => 'infinite',
};

export function CallCount(
  chuncSize = 1,
  scope?,
  period: string | stringFn = 'daily',
) {
  let logger: Logger;
  const periodFn =
    typeof period === 'string'
      ? knownPeriods[period] || knownPeriods[period].daily
      : period;
  let metadataParams;

  return (target, methodName, descriptor) => {
    metadataParams = scope || [target, methodName];
    scope = scope || target.constructor;
    const className = scope.name;
    const methodStr = typeof scope === 'function' ? '' : `::${methodName}`;
    logger = new Logger(`CallCount for ${className}${methodStr}`);

    if (chuncSize) {
      setMetadata(CHUNK_SIZE, chuncSize);
    }
    setLogger(target, methodName);
    const original = descriptor.value;
    descriptor.value = new Proxy(original, {
      apply(fn: any, thisArg: any, argArray?: any): any {
        incrementCalls();
        return fn.apply(thisArg, argArray);
      },
    });
    return descriptor;
  };

  function setLogger(target, key) {
    const metadataLogger = Reflect.getMetadata(LOGGER, target, key);
    const definedLogger = getMetadata(LOGGER);
    logger = metadataLogger || definedLogger || logger;
    setMetadata(LOGGER, logger);
  }

  function incrementCalls() {
    resetOnNewPeriod();
    const counter = getMetadata(CALL_COUNT) || 0;
    const newCounter = +counter + 1;
    setCalls(newCounter);
    const chunkSize = getChunkSize();
    if (newCounter > 0 && newCounter % chunkSize === 0) {
      logger.log(newCounter);
    }
  }

  function resetOnNewPeriod() {
    const period = periodFn();
    const lastPeriod = getMetadata(LAST_PERIOD);
    if (lastPeriod === period) {
      return;
    }
    setMetadata(LAST_PERIOD, period);
    if (!lastPeriod) {
      return;
    }
    const callsCount = getMetadata(LAST_PERIOD);
    setCalls(0);
    if (getChunkSize() !== 1) {
      logger.log(`${lastPeriod}: ${callsCount}`);
    }
  }

  function setCalls(workers) {
    setMetadata(CALL_COUNT, workers);
  }

  function getChunkSize() {
    return +getMetadata(CHUNK_SIZE) || 1;
  }

  function getMetadata(key) {
    if (Array.isArray(metadataParams)) {
      return Reflect.getMetadata(key, metadataParams[0], metadataParams[1]);
    }
    return Reflect.getMetadata(key, metadataParams);
  }

  function setMetadata(key, value) {
    if (Array.isArray(metadataParams)) {
      Reflect.deleteMetadata(key, metadataParams[0], metadataParams[1]);
      Reflect.defineMetadata(key, value, metadataParams[0], metadataParams[1]);
    }
    Reflect.deleteMetadata(key, metadataParams);
    Reflect.defineMetadata(key, value, metadataParams);
  }
}
