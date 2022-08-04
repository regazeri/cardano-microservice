/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/tslint/config */
import { IAsyncRetryOptions } from '../interfaces/async-retry-options';
import { sleep } from './sleep';
type Callback<T> = () => Promise<T>;
import * as config from 'config';

export class AsyncRetry {
  public static async retry<T>(
    callback: Callback<T>,
    options: IAsyncRetryOptions = {},
  ): Promise<T> {
    // TODO: move to decorator
    options = AsyncRetry.getOptions(options);
    let tries = 0;
    const endTime = Date.now() + 1000 * options.maxTime;
    const continueCondition = () =>
      ++tries < options.maxRetries && Date.now() < endTime;
    const errorCheckFn =
      typeof options.retryErrors === 'function'
        ? options.retryErrors
        : e =>
            !(options.retryErrors as number[]).includes(
              AsyncRetry.getErrorCode(e),
            );
    let error: Error;
    do {
      try {
        return await callback();
      } catch (e) {
        if (!continueCondition() || errorCheckFn(e)) {
          throw e;
        }
        error = e;
      }
      await sleep(options.delay * 1000);
    } while (Date.now() <= endTime);

    if (error) {
      throw error;
    }
  }

  private static getOptions(options: IAsyncRetryOptions): IAsyncRetryOptions {
    let maxRetries =
      (!isNaN(+options.maxRetries)
        ? +options.maxRetries
        : config.AsyncRetry.maxRetries) || Infinity;
    const maxTime =
      (!isNaN(+options.maxTime)
        ? +options.maxTime
        : config.AsyncRetry.maxTime) || Infinity;
    const delay = !isNaN(+options.delay)
      ? options.delay
      : config.AsyncRetry.delay;
    const retryErrors =
      options.retryErrors || config.AsyncRetry.retryErrors || [];

    if (maxRetries <= 0) {
      throw new Error('Maximum number of retries must be a positive number.');
    }
    if (maxTime <= 0) {
      throw new Error('Maximum time for retries must be a positive number.');
    }
    if (delay < 0) {
      throw new Error('Delay must be a nonnegative number.');
    }
    if (maxRetries === Infinity && maxTime === Infinity) {
      maxRetries = 5;
    }
    if (maxRetries === Infinity && delay === 0) {
      throw new Error("Delay can't be 0 with unlimited retries.");
    }

    return { maxRetries, delay, maxTime, retryErrors };
  }

  private static getErrorCode(e) {
    if (!e) {
      return e;
    }
    if (e.status) {
      return e.status;
    }
    if (e.code) {
      return e.code;
    }
    if (e?.response?.status) {
      if (typeof e.response.status === 'function') {
        return e.response.status();
      }
      return e.response.status;
    }
    return undefined;
  }
}
