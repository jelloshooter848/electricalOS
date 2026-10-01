import { CalcError, type ConductorSize, type NecRef } from "./types";

export type ConduitType = "EMT" | "RMC" | "PVC40" | "PVC80";
export type Insulation = "THHN" | "THWN" | "THWN-2" | "XHHW" | "XHHW-2";

export const CONDUIT_TYPE_LABEL: Record<ConduitType, string> = {
  EMT: "Electrical metallic tubing",
  RMC: "Rigid metal conduit",
  PVC40: "Rigid PVC conduit, Schedule 40",
  PVC80: "Rigid PVC conduit, Schedule 80",
};

/** Trade sizes in ascending order, as strings the UI can show directly. */
export const TRADE_SIZES = ["1/2", "3/4", "1", "1-1/4", "1-1/2", "2", "2-1/2", "3", "3-1/2", "4", "5", "6"] as const;
export type TradeSize = (typeof TRADE_SIZES)[number];

/**
 * Total internal cross-sectional area (100%) in square inches, NEC Chapter 9
 * Table 4. Missing entries mean the trade size is not made in that type.
 *
 * DATA STATUS: transcribed from memory; verify every value against the
 * adopted edition before release (docs/data-verification.md).
 */
export const CONDUIT_AREA_IN2: Record<ConduitType, Partial<Record<TradeSize, number>>> = {
  EMT: {
    "1/2": 0.304, "3/4": 0.533, "1": 0.864, "1-1/4": 1.496, "1-1/2": 2.036,
    "2": 3.356, "2-1/2": 5.858, "3": 8.846, "3-1/2": 11.545, "4": 14.753,
  },
  RMC: {
    "1/2": 0.314, "3/4": 0.549, "1": 0.887, "1-1/4": 1.526, "1-1/2": 2.071,
    "2": 3.408, "2-1/2": 4.866, "3": 7.499, "3-1/2": 10.010, "4": 12.882, "5": 20.212, "6": 29.158,
  },
  PVC40: {
    "1/2": 0.285, "3/4": 0.508, "1": 0.832, "1-1/4": 1.453, "1-1/2": 1.986,
    "2": 3.291, "2-1/2": 4.695, "3": 7.268, "3-1/2": 9.737, "4": 12.554, "5": 19.761, "6": 28.567,
  },
  PVC80: {
    "1/2": 0.217, "3/4": 0.409, "1": 0.688, "1-1/4": 1.237, "1-1/2": 1.711,
    "2": 2.874, "2-1/2": 4.119, "3": 6.442, "3-1/2": 8.688, "4": 11.258, "5": 17.855, "6": 25.598,
  },
};

/**
 * Approximate conductor area in square inches, NEC Chapter 9 Table 5.
 * THHN, THWN and THWN-2 share one column; XHHW and XHHW-2 share another.
 *
 * DATA STATUS: transcribed from memory; verify before release.
 */
const THHN_AREA: Record<ConductorSize, number> = {
  "14": 0.0097, "12": 0.0133, "10": 0.0211, "8": 0.0366, "6": 0.0507, "4": 0.0824,
  "3": 0.0973, "2": 0.1158, "1": 0.1562, "1/0": 0.1855, "2/0": 0.2223, "3/0": 0.2679,
  "4/0": 0.3237, "250": 0.3970, "300": 0.4608, "350": 0.5242, "400": 0.5863, "500": 0.7073,
  "600": 0.8676, "700": 0.9887, "750": 1.0496, "800": 1.1085, "900": 1.2311, "1000": 1.3478,
};
const XHHW_AREA: Record<ConductorSize, number> = {
  "14": 0.0139, "12": 0.0181, "10": 0.0243, "8": 0.0437, "6": 0.0590, "4": 0.0814,
  "3": 0.0962, "2": 0.1146, "1": 0.1534, "1/0": 0.1825, "2/0": 0.2190, "3/0": 0.2642,
  "4/0": 0.3197, "250": 0.3904, "300": 0.4536, "350": 0.5166, "400": 0.5782, "500": 0.6984,
  "600": 0.8709, "700": 0.9923, "750": 1.0532, "800": 1.1122, "900": 1.2351, "1000": 1.3519,
};

export const CONDUCTOR_AREA_IN2: Record<Insulation, Record<ConductorSize, number>> = {
  THHN: THHN_AREA,
  THWN: THHN_AREA,
  "THWN-2": THHN_AREA,
  XHHW: XHHW_AREA,
  "XHHW-2": XHHW_AREA,
};

/**
 * Maximum percent of conduit area that conductors may occupy, NEC Chapter 9
 * Table 1, and Note 4 for nipples not over 24 inches.
 */
export function maxFillPercent(conductorCount: number, isNipple = false): number {
  if (isNipple) return 60;
  if (conductorCount === 1) return 53;
  if (conductorCount === 2) return 31;
  return 40;
}

export interface ConductorGroup {
  size: ConductorSize;
  insulation: Insulation;
  count: number;
}

export interface ConduitFillInput {
  conductors: ConductorGroup[];
  conduitType: ConduitType;
  /** Raceway 24 inches or shorter between boxes/enclosures (Chapter 9 Note 4). */
  isNipple?: boolean;
}

export interface ConduitFillResult {
  tradeSize: TradeSize;
  conductorCount: number;
  totalConductorAreaIn2: number;
  conduitAreaIn2: number;
  allowedAreaIn2: number;
  fillPercent: number;
  maxFillPercent: number;
  refs: NecRef[];
}

export function totalConductorArea(conductors: ConductorGroup[]): { count: number; areaIn2: number } {
  let count = 0;
  let areaIn2 = 0;
  for (const g of conductors) {
    if (!Number.isInteger(g.count) || g.count < 0) throw new CalcError("Conductor count must be a whole number.");
    count += g.count;
    areaIn2 += CONDUCTOR_AREA_IN2[g.insulation][g.size] * g.count;
  }
  if (count === 0) throw new CalcError("Add at least one conductor.");
  return { count, areaIn2 };
}

function fillRefs(count: number, isNipple: boolean, conduitType: ConduitType): NecRef[] {
  const refs: NecRef[] = [
    { section: "Chapter 9 Table 1", note: `Fill limited to ${maxFillPercent(count, isNipple)}% for ${count} conductor${count === 1 ? "" : "s"}.` },
    { section: "Chapter 9 Table 4", note: `Internal area of ${CONDUIT_TYPE_LABEL[conduitType]}.` },
    { section: "Chapter 9 Table 5", note: "Approximate area of each insulated conductor." },
  ];
  if (isNipple) refs.push({ section: "Chapter 9 Note 4", note: "Nipple not over 24 inches: 60% fill and no ampacity adjustment." });
  return refs;
}

/** Fill check for a specific trade size. */
export function checkConduitFill(input: ConduitFillInput & { tradeSize: TradeSize }): ConduitFillResult & { compliant: boolean } {
  const { count, areaIn2 } = totalConductorArea(input.conductors);
  const isNipple = input.isNipple ?? false;
  const conduitArea = CONDUIT_AREA_IN2[input.conduitType][input.tradeSize];
  if (conduitArea === undefined) throw new CalcError(`${input.tradeSize} inch is not a listed size for ${CONDUIT_TYPE_LABEL[input.conduitType]}.`);
  const pct = maxFillPercent(count, isNipple);
  const allowed = conduitArea * (pct / 100);
  return {
    tradeSize: input.tradeSize,
    conductorCount: count,
    totalConductorAreaIn2: areaIn2,
    conduitAreaIn2: conduitArea,
    allowedAreaIn2: allowed,
    fillPercent: (areaIn2 / conduitArea) * 100,
    maxFillPercent: pct,
    compliant: areaIn2 <= allowed + 1e-9,
    refs: fillRefs(count, isNipple, input.conduitType),
  };
}

/** Smallest trade size of the given conduit type that holds the conductors within Table 1 limits. */
export function minimumConduitSize(input: ConduitFillInput): ConduitFillResult {
  for (const tradeSize of TRADE_SIZES) {
    if (CONDUIT_AREA_IN2[input.conduitType][tradeSize] === undefined) continue;
    const r = checkConduitFill({ ...input, tradeSize });
    if (r.compliant) {
      const { compliant: _c, ...rest } = r;
      return rest;
    }
  }
  throw new CalcError(`These conductors do not fit in the largest listed ${CONDUIT_TYPE_LABEL[input.conduitType]}. Split into multiple raceways.`);
}
