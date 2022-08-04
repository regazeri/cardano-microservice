/* eslint-disable @typescript-eslint/tslint/config */
/* eslint-disable @typescript-eslint/naming-convention */
type errorCheckFn = (any) => boolean;
export interface IAsyncRetryOptions {
  maxRetries?: number;
  maxTime?: number;
  delay?: number;
  retryErrors?: number[] | errorCheckFn;
}
