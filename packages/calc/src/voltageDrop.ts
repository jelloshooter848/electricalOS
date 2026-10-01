import { CIRCULAR_MILS, sizesFor } from "./conductors";
import { CalcError, type ConductorSize, type Material, type NecRef, type Phase } from "./types";

/**
 * Effective conductor constant K (ohm-cmil/ft) at roughly 75 C operating
 * temperature. This is the field-standard approximation used in trade
 * references; results are within a few percent of Chapter 9 Table 8/9.
 */
export const K_CONSTANT: Record<Material, number> = { Cu: 12.9, Al: 21.2 };

export interface VoltageDropInput {
  /** System voltage, line-to-line for 3-phase, line-to-neutral or L-L for single-phase as wired. */
  voltage: number;
  /** Load current in amperes. */
  amps: number;
  /** One-way circuit length in feet (source to load). */
  lengthFt: number;
  size: ConductorSize;
  material: Material;
  phase: Phase;
  /** Number of parallel conductors per phase (default 1). */
  parallelSets?: number;
}

export interface VoltageDropResult {
  dropVolts: number;
  dropPercent: number;
  voltageAtLoad: number;
  refs: NecRef[];
}

const VD_REFS: NecRef[] = [
  {
    section: "210.19(A)(1) Informational Note",
    note: "Branch-circuit drop of 3% or less, and 5% or less for feeder plus branch combined, gives reasonable efficiency. Informational, not a requirement.",
  },
  {
    section: "215.2(A)(1) Informational Note",
    note: "Same 3% / 5% guidance stated for feeders.",
  },
];

/** Voltage drop by the K-constant method: VD = m * K * I * L / CM. */
export function voltageDrop(input: VoltageDropInput): VoltageDropResult {
  const { voltage, amps, lengthFt, size, material, phase } = input;
  const parallelSets = input.parallelSets ?? 1;
  if (voltage <= 0) throw new CalcError("Voltage must be greater than zero.");
  if (amps < 0) throw new CalcError("Current cannot be negative.");
  if (lengthFt < 0) throw new CalcError("Length cannot be negative.");
  if (!Number.isInteger(parallelSets) || parallelSets < 1) {
    throw new CalcError("Parallel sets must be a whole number of 1 or more.");
  }
  const cm = CIRCULAR_MILS[size] * parallelSets;
  const multiplier = phase === 3 ? Math.sqrt(3) : 2;
  const dropVolts = (multiplier * K_CONSTANT[material] * amps * lengthFt) / cm;
  return {
    dropVolts,
    dropPercent: (dropVolts / voltage) * 100,
    voltageAtLoad: voltage - dropVolts,
    refs: VD_REFS,
  };
}

export interface SizeForVoltageDropInput extends Omit<VoltageDropInput, "size"> {
  /** Maximum acceptable drop in percent (e.g. 3). */
  maxDropPercent: number;
  /** Do not return a conductor smaller than this (e.g. the size already required for ampacity). */
  minimumSize?: ConductorSize;
}

export interface SizeForVoltageDropResult extends VoltageDropResult {
  size: ConductorSize;
}

/**
 * Smallest conductor that keeps voltage drop at or under `maxDropPercent`.
 * Throws if no listed size (even 1000 kcmil) meets the target; the caller
 * should then suggest parallel conductors or a higher voltage.
 */
export function sizeForVoltageDrop(input: SizeForVoltageDropInput): SizeForVoltageDropResult {
  if (input.maxDropPercent <= 0) throw new CalcError("Maximum drop percent must be greater than zero.");
  const candidates = sizesFor(input.material);
  const startIdx = input.minimumSize ? Math.max(0, candidates.indexOf(input.minimumSize)) : 0;
  for (const size of candidates.slice(startIdx)) {
    const r = voltageDrop({ ...input, size });
    if (r.dropPercent <= input.maxDropPercent) return { size, ...r };
  }
  throw new CalcError(
    `No single ${input.material} conductor up to 1000 kcmil keeps drop under ${input.maxDropPercent}%. Consider parallel sets or a higher voltage.`,
  );
}
