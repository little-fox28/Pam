const KG_PER_LB = 0.45359237;
const CM_PER_INCH = 2.54;

export type WeightUnit = 'kg' | 'lbs';
export type HeightUnit = 'cm' | 'ft';

const round = (value: number, digits: number) => {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
};

/** Converts SI kg (stored value) to the display unit. */
export function kgToDisplay(kg: number, unit: WeightUnit): number {
  return unit === 'kg' ? kg : kg / KG_PER_LB;
}

/** Formats a stored kg value, e.g. `72.5 kg` or `159.8 lbs`. */
export function formatWeight(kg: number, unit: WeightUnit, digits = 1): string {
  return `${round(kgToDisplay(kg, unit), digits)} ${unit}`;
}

/**
 * Parses user input in the display unit into SI kg.
 * Accepts `,` or `.` as decimal separator. Returns null for invalid or non-positive input.
 */
export function parseWeightInput(input: string, unit: WeightUnit): number | null {
  const value = Number.parseFloat(input.trim().replace(',', '.'));
  if (!Number.isFinite(value) || value <= 0) return null;
  return unit === 'kg' ? value : value * KG_PER_LB;
}

/** Formats stored cm, e.g. `175 cm` or `5′9″`. */
export function formatHeight(cm: number, unit: HeightUnit): string {
  if (unit === 'cm') return `${round(cm, 1)} cm`;
  const totalInches = Math.round(cm / CM_PER_INCH);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}′${inches}″`;
}

