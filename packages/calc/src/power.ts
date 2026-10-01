import { CalcError, type NecRef, type Phase } from "./types";

/** Basic electrical relationships. No code sections apply; this is physics the other calculators lean on. */

export interface PowerInput {
  phase: Phase;
  /** Line-to-line volts for three-phase; the circuit voltage for single-phase. */
  volts?: number;
  amps?: number;
  /** Real power in watts. */
  watts?: number;
  /** Apparent power in volt-amperes. */
  va?: number;
  /** Power factor 0 < pf <= 1 (default 1). */
  powerFactor?: number;
}

export interface PowerResult {
  volts: number;
  amps: number;
  watts: number;
  va: number;
  powerFactor: number;
  phase: Phase;
  refs: NecRef[];
}

const PF_REF: NecRef = { section: "none", note: "Ohm's law and power relationships; not a code requirement." };

function k(phase: Phase): number {
  return phase === 3 ? Math.sqrt(3) : 1;
}

/**
 * Solve for whichever two of volts/amps/watts/va are missing. Provide volts plus one of
 * amps, watts or va, or amps plus watts or va. Power factor defaults to 1.
 */
export function solvePower(input: PowerInput): PowerResult {
  const pf = input.powerFactor ?? 1;
  if (!(pf > 0 && pf <= 1)) throw new CalcError("Power factor must be between 0 and 1.");
  const m = k(input.phase);
  let { volts, amps, watts, va } = input;
  for (const [name, v] of Object.entries({ volts, amps, watts, va })) {
    if (v !== undefined && !(v >= 0)) throw new CalcError(`${name} cannot be negative.`);
  }
  if (va === undefined && watts !== undefined) va = watts / pf;
  if (watts === undefined && va !== undefined) watts = va * pf;
  if (volts !== undefined && amps !== undefined) {
    va = m * volts * amps;
    watts = va * pf;
  } else if (volts !== undefined && va !== undefined) {
    if (volts === 0) throw new CalcError("Voltage must be greater than zero to solve for current.");
    amps = va / (m * volts);
  } else if (amps !== undefined && va !== undefined) {
    if (amps === 0) throw new CalcError("Current must be greater than zero to solve for voltage.");
    volts = va / (m * amps);
  } else {
    throw new CalcError("Enter two of: volts, amps, watts or VA.");
  }
  if (volts === undefined || amps === undefined || watts === undefined || va === undefined) {
    throw new CalcError("Enter two of: volts, amps, watts or VA.");
  }
  return { volts, amps, watts, va, powerFactor: pf, phase: input.phase, refs: [PF_REF] };
}

/** Amps drawn by a kW load at a voltage. */
export function kwToAmps(kw: number, volts: number, phase: Phase, powerFactor = 1): number {
  return solvePower({ phase, volts, watts: kw * 1000, powerFactor }).amps;
}

/** kVA of a load from volts and amps. */
export function ampsToKva(amps: number, volts: number, phase: Phase): number {
  return solvePower({ phase, volts, amps }).va / 1000;
}
