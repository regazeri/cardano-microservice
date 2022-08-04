/* eslint-disable @typescript-eslint/tslint/config */
import { IAsyncRetryOptions } from '../interfaces/async-retry-options';
import { AsyncRetry as Retrier } from '../not-in-module/async-retry';

export function AsyncRetry(options: IAsyncRetryOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const origFn = descriptor.value;
    descriptor.value = new Proxy(origFn, {
      apply(fn: any, thisArg: any, argArray?: any): any {
        return Retrier.retry(() => fn.apply(thisArg, argArray), options);
      },
    });
  };
}
