import { create } from 'zustand';

import { readEnum, settingsStorage } from '@/lib/storage';
import type { HeightUnit, WeightUnit } from '@/utils/units';

const WEIGHT_UNITS = ['kg', 'lbs'] as const;
const HEIGHT_UNITS = ['cm', 'ft'] as const;

type UnitsState = {
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;
  setWeightUnit: (unit: WeightUnit) => void;
  setHeightUnit: (unit: HeightUnit) => void;
};

/** Display preferences only. Stored data always stays in SI (kg, cm). */
export const useUnitsStore = create<UnitsState>((set) => ({
  weightUnit: readEnum(settingsStorage, 'units.weight', WEIGHT_UNITS, 'kg'),
  heightUnit: readEnum(settingsStorage, 'units.height', HEIGHT_UNITS, 'cm'),
  setWeightUnit: (weightUnit) => {
    settingsStorage.set('units.weight', weightUnit);
    set({ weightUnit });
  },
  setHeightUnit: (heightUnit) => {
    settingsStorage.set('units.height', heightUnit);
    set({ heightUnit });
  },
}));

