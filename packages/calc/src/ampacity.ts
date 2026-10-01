import { AMPACITY_310_16, SMALL_CONDUCTOR_OCPD_MAX, sizesFor } from "./conductors";
import { CalcError, type ConductorSize, type Material, type NecRef } from "./types";

export type InsulationTempC = 60 | 75 | 90;
export type TerminationTempC = 60 | 75;

const COLUMN: Record<InsulationTempC, 0 | 1 | 2> = { 60: 0, 75: 1, 90: 2 };

/**
 * Ambient temperature correction, NEC 310.15(B)(2) equation form:
 * factor = sqrt((Tc - Ta) / (Tc - 30)). Rounded to two decimals, which
 * reproduces the 310.15(B)(1)(1) table values. Returns 0 when the ambient
 * meets or exceeds the insulation rating (conductor cannot be used).
 */
export function ambientCorrectionFactor(insulationTempC: InsulationTempC, ambientC: number): number {
  if (ambientC >= insulationTempC) return 0;
  const f = Math.sqrt((insulationTempC - ambientC) / (insulationTempC - 30));
  return Math.round(f * 100) / 100;
}

/**
 * Adjustment for more than three current-carrying conductors bundled or in
 * one raceway, NEC 310.15(C)(1). Returns 1 for three or fewer.
 */
export function bundlingAdjustmentFactor(currentCarryingConductors: number): number {
  const n = currentCarryingConductors;
  if (!Number.isInteger(n) || n < 1) throw new CalcError("Conductor count must be a whole number of 1 or more.");
  if (n <= 3) return 1;
  if (n <= 6) return 0.8;
  if (n <= 9) return 0.7;
  if (n <= 20) return 0.5;
  if (n <= 30) return 0.45;
  if (n <= 40) return 0.4;
  return 0.35;
}

/**
 * Default termination temperature per NEC 110.14(C)(1): 60 C for circuits
 * rated 100 A or less, 75 C for circuits rated over 100 A, unless the
 * equipment is listed and marked otherwise.
 */
export function defaultTerminationTemp(circuitRatingAmps: number): TerminationTempC {
  return circuitRatingAmps <= 100 ? 60 : 75;
}

export interface AmpacityInput {
  size: ConductorSize;
  material: Material;
  /** Insulation temperature rating, e.g. 90 for THHN/THWN-2/XHHW-2, 75 for THW/THWN, 60 for TW. */
  insulationTempC: InsulationTempC;
  /** Ambient temperature in C (default 30). */
  ambientC?: number;
  /** Current-carrying conductors in the raceway or bundle (default 3). */
  currentCarryingConductors?: number;
  /** Termination rating of the connected equipment (default from 110.14(C) using the circuit rating, else 75). */
  terminationTempC?: TerminationTempC;
}

export interface AmpacityResult {
  /** Table value in the insulation's column before any factors. */
  tableAmpacity: number;
  ambientFactor: number;
  bundlingFactor: number;
  /** Table value x ambient factor x bundling factor. */
  adjustedAmpacity: number;
  /** Table value in the termination temperature column (not corrected; 110.14(C)). */
  terminationAmpacity: number;
  /** The usable ampacity: the lesser of adjusted and termination ampacity. */
  allowableAmpacity: number;
  /** 240.4(D) small-conductor OCPD cap, if any. */
  smallConductorOcpdMax: number | undefined;
  refs: NecRef[];
}

function tableValue(material: Material, size: ConductorSize, col: InsulationTempC): number {
  const row = AMPACITY_310_16[material][size];
  if (!row) throw new CalcError(`${size} AWG is not listed for ${material === "Al" ? "aluminum" : "copper"} in Table 310.16.`);
  return row[COLUMN[col]];
}

/** Allowable ampacity of a single conductor after 310.15 corrections and 110.14(C) termination limits. */
export function conductorAmpacity(input: AmpacityInput): AmpacityResult {
  const ambientC = input.ambientC ?? 30;
  const ccc = input.currentCarryingConductors ?? 3;
  const terminationTempC: TerminationTempC = input.terminationTempC ?? 75;
  const tableAmpacity = tableValue(input.material, input.size, input.insulationTempC);
  const ambientFactor = ambientCorrectionFactor(input.insulationTempC, ambientC);
  const bundlingFactor = bundlingAdjustmentFactor(ccc);
  const adjustedAmpacity = Math.floor(tableAmpacity * ambientFactor * bundlingFactor * 100) / 100;
  const terminationCol: InsulationTempC = Math.min(terminationTempC, input.insulationTempC) as InsulationTempC;
  const terminationAmpacity = tableValue(input.material, input.size, terminationCol);
  const allowableAmpacity = Math.min(adjustedAmpacity, terminationAmpacity);
  const refs: NecRef[] = [
    { section: "310.16", note: `Table ampacity for ${input.size} ${input.material} in the ${input.insulationTempC} C column.` },
  ];
  if (ambientFactor !== 1) refs.push({ section: "310.15(B)(1)", note: `Ambient correction for ${ambientC} C applied.` });
  if (bundlingFactor !== 1) refs.push({ section: "310.15(C)(1)", note: `Adjustment for ${ccc} current-carrying conductors applied.` });
  refs.push({ section: "110.14(C)", note: `Termination limited to the ${terminationCol} C column value.` });
  const smallConductorOcpdMax = SMALL_CONDUCTOR_OCPD_MAX[input.material][input.size];
  if (smallConductorOcpdMax !== undefined) {
    refs.push({ section: "240.4(D)", note: `Overcurrent protection for this size is capped at ${smallConductorOcpdMax} A unless an exception applies.` });
  }
  return {
    tableAmpacity,
    ambientFactor,
    bundlingFactor,
    adjustedAmpacity,
    terminationAmpacity,
    allowableAmpacity,
    smallConductorOcpdMax,
    refs,
  };
}

export interface SizeConductorInput extends Omit<AmpacityInput, "size"> {
  /** Load that runs 3 hours or more, amps. */
  continuousAmps: number;
  /** Load that does not run 3 hours or more, amps (default 0). */
  noncontinuousAmps?: number;
}

export interface SizeConductorResult extends AmpacityResult {
  size: ConductorSize;
  /** 125% continuous + 100% noncontinuous, the minimum before adjustment (210.19(A)(1)(a), 215.2(A)(1)(a)). */
  requiredBeforeAdjustment: number;
  /** 100% of the total load, which the adjusted ampacity must carry (210.19(A)(1)(b), 215.2(A)(1)(b)). */
  requiredAfterAdjustment: number;
}

/**
 * Smallest conductor that satisfies both branch-circuit/feeder sizing rules:
 *  (a) termination-column ampacity >= 125% continuous + 100% noncontinuous, and
 *  (b) corrected and adjusted ampacity >= 100% of the total load.
 */
export function sizeConductor(input: SizeConductorInput): SizeConductorResult {
  const noncontinuous = input.noncontinuousAmps ?? 0;
  if (input.continuousAmps < 0 || noncontinuous < 0) throw new CalcError("Load current cannot be negative.");
  const requiredBeforeAdjustment = 1.25 * input.continuousAmps + noncontinuous;
  const requiredAfterAdjustment = input.continuousAmps + noncontinuous;
  if (requiredAfterAdjustment === 0) throw new CalcError("Enter a load greater than zero.");
  for (const size of sizesFor(input.material)) {
    const r = conductorAmpacity({ ...input, size });
    if (r.terminationAmpacity >= requiredBeforeAdjustment && r.adjustedAmpacity >= requiredAfterAdjustment) {
      const refs = [
        ...r.refs,
        { section: "210.19(A)(1) / 215.2(A)(1)", note: "Sized for 125% of continuous plus 100% of noncontinuous load before adjustment, and 100% of load after adjustment." },
      ];
      return { size, requiredBeforeAdjustment, requiredAfterAdjustment, ...r, refs };
    }
  }
  throw new CalcError("No single conductor up to 1000 kcmil is large enough. Consider parallel conductors (310.10(G)).");
}
