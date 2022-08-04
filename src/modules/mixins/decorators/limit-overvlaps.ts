/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/tslint/config */
import 'reflect-metadata';

const LIMIT_OVERLAPS = Symbol('LIMIT_OVERLAPS');

// TODO: specify default return value where limit reached in silent mode
export function LimitOverlaps(
  maxOverlaps = 1,
  silent = false,
): MethodDecorator {
  return function (target, key?, descriptor?: TypedPropertyDescriptor<any>) {
    const origFn = descriptor.value;
    if (!Reflect.hasMetadata(LIMIT_OVERLAPS, target, key)) {
      Reflect.defineMetadata(LIMIT_OVERLAPS, 0, target, key);
    }
    descriptor.value = async function (...args) {
      const workers = Reflect.getMetadata(LIMIT_OVERLAPS, target, key);
      if (workers >= maxOverlaps) {
        if (silent) {
          return;
        }
        throw new Error(
          `Only ${maxOverlaps} workers allowed for ${key.toString()} method.`,
        );
      }
      increaseWorkers(target, key);
      let err;
      let result;
      try {
        result = await origFn.bind(this)(...args);
      } catch (e) {
        err = e;
      }
      decreaseWorkers(target, key);
      if (err) {
        throw err;
      }
      return result;
    };
  };

  function increaseWorkers(target, key) {
    const workers = Reflect.getMetadata(LIMIT_OVERLAPS, target, key);
    setWorkers(target, key, workers + 1);
  }

  function decreaseWorkers(target, key) {
    const workers = Reflect.getMetadata(LIMIT_OVERLAPS, target, key);
    setWorkers(target, key, workers - 1);
  }

  function setWorkers(target, key, workers) {
    Reflect.deleteMetadata(LIMIT_OVERLAPS, target, key);
    Reflect.defineMetadata(LIMIT_OVERLAPS, workers, target, key);
  }
}
