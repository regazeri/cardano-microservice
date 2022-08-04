/* eslint-disable @typescript-eslint/tslint/config */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable quote-props */
export const netConfig = {
  Mainnet: {
    "adaPerUTxOWord": 0,
    "executionPrices": {
      "prMem": 1,
      "prSteps": 1
    },
    "maxTxExUnits": {
      "exUnitsMem": 1,
      "exUnitsSteps": 1
    },
    "maxBlockExUnits": {
      "exUnitsMem": 1,
      "exUnitsSteps": 1
    },
    "maxValueSize": 1000,
    "collateralPercentage": 100,
    "maxCollateralInputs": 1
  },
 testnet:{
  "adaPerUTxOWord": 0,
  "executionPrices": {
    "prMem": 1,
    "prSteps": 1
  },
  "maxTxExUnits": {
    "exUnitsMem": 1,
    "exUnitsSteps": 1
  },
  "maxBlockExUnits": {
    "exUnitsMem": 1,
    "exUnitsSteps": 1
  },
  "maxValueSize": 1000,
  "collateralPercentage": 100,
  "maxCollateralInputs": 1
}
};
