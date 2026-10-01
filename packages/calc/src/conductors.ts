import { CONDUCTOR_SIZES, type ConductorSize, type Material } from "./types";

/**
 * Conductor cross-section in circular mils. These are standard AWG/kcmil
 * dimensions (not NEC-specific). kcmil sizes are size x 1000.
 */
export const CIRCULAR_MILS: Record<ConductorSize, number> = {
  "14": 4110,
  "12": 6530,
  "10": 10380,
  "8": 16510,
  "6": 26240,
  "4": 41740,
  "3": 52620,
  "2": 66360,
  "1": 83690,
  "1/0": 105600,
  "2/0": 133100,
  "3/0": 167800,
  "4/0": 211600,
  "250": 250000,
  "300": 300000,
  "350": 350000,
  "400": 400000,
  "500": 500000,
  "600": 600000,
  "700": 700000,
  "750": 750000,
  "800": 800000,
  "900": 900000,
  "1000": 1000000,
};

/**
 * Allowable ampacities for insulated conductors, not more than three
 * current-carrying conductors in a raceway/cable/earth, 30 C ambient.
 * Columns: [60C, 75C, 90C]. Source: NEC 310.16 (2020/2023/2026 numbering).
 * A `null` means the size is not listed for that material (no 14 AWG Al).
 *
 * DATA STATUS: transcribed from memory of the table; every row must be
 * spot-checked against the adopted edition before release (see
 * docs/data-verification.md).
 */
export type AmpacityRow = readonly [c60: number, c75: number, c90: number];

export const AMPACITY_310_16: Record<Material, Partial<Record<ConductorSize, AmpacityRow>>> = {
  Cu: {
    "14": [15, 20, 25],
    "12": [20, 25, 30],
    "10": [30, 35, 40],
    "8": [40, 50, 55],
    "6": [55, 65, 75],
    "4": [70, 85, 95],
    "3": [85, 100, 115],
    "2": [95, 115, 130],
    "1": [110, 130, 145],
    "1/0": [125, 150, 170],
    "2/0": [145, 175, 195],
    "3/0": [165, 200, 225],
    "4/0": [195, 230, 260],
    "250": [215, 255, 290],
    "300": [240, 285, 320],
    "350": [260, 310, 350],
    "400": [280, 335, 380],
    "500": [320, 380, 430],
    "600": [350, 420, 475],
    "700": [385, 460, 520],
    "750": [400, 475, 535],
    "800": [410, 490, 555],
    "900": [435, 520, 585],
    "1000": [455, 545, 615],
  },
  Al: {
    "12": [15, 20, 25],
    "10": [25, 30, 35],
    "8": [35, 40, 45],
    "6": [40, 50, 55],
    "4": [55, 65, 75],
    "3": [65, 75, 85],
    "2": [75, 90, 100],
    "1": [85, 100, 115],
    "1/0": [100, 120, 135],
    "2/0": [115, 135, 150],
    "3/0": [130, 155, 175],
    "4/0": [150, 180, 205],
    "250": [170, 205, 230],
    "300": [195, 230, 260],
    "350": [210, 250, 280],
    "400": [225, 270, 305],
    "500": [260, 310, 350],
    "600": [285, 340, 385],
    "700": [315, 375, 425],
    "750": [320, 385, 435],
    "800": [330, 395, 445],
    "900": [355, 425, 480],
    "1000": [375, 445, 500],
  },
};

/**
 * Overcurrent protection caps for small conductors, NEC 240.4(D).
 * Applies unless a specific rule in 240.4(E) or (G) permits otherwise.
 */
export const SMALL_CONDUCTOR_OCPD_MAX: Record<Material, Partial<Record<ConductorSize, number>>> = {
  Cu: { "14": 15, "12": 20, "10": 30 },
  Al: { "12": 15, "10": 25 },
};

/** Sizes available for a material, in ascending order. */
export function sizesFor(material: Material): ConductorSize[] {
  return CONDUCTOR_SIZES.filter((s) => AMPACITY_310_16[material][s] !== undefined);
}
