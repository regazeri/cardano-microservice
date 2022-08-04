/* eslint-disable @typescript-eslint/tslint/config */
export interface ILogger {
  log: (...args: any[]) => any;
  warn?: (...args: any[]) => any;
  error?: (...args: any[]) => any;
  info?: (...args: any[]) => any;
}
export const LOGGER = Symbol('LOGGER');
export function SetLogger(logger: ILogger) {
  return function (target, methodName, descriptor) {
    if (Reflect.getMetadata(LOGGER, target, methodName)) {
      Reflect.deleteMetadata(LOGGER, target, methodName);
    }
    Reflect.defineMetadata(LOGGER, logger, target, methodName);
    return descriptor;
  };
}
