/* eslint-disable arrow-body-style */
/* eslint-disable @typescript-eslint/tslint/config */
import * as config from 'config';

export function DisableSync() {
  return (target, methodName, descriptor) => {
    if (config.coin.disableSync) {
      descriptor.value = (): void => {
        return;
      };
    }
    return descriptor;
  };
}
