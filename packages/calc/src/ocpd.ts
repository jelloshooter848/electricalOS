import { CalcError } from "./types";

/** Standard ampere ratings for fuses and inverse-time breakers, NEC 240.6(A). */
export const STANDARD_OCPD_AMPS: readonly number[] = [
  15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 225, 250, 300, 350, 400, 450, 500,
  600, 700, 800, 1000, 1200, 1600, 2000, 2500, 3000, 4000, 5000, 6000,
];

/** Smallest standard rating at or above `amps`. */
export function nextStandardOcpdUp(amps: number): number {
  if (!(amps > 0)) throw new CalcError("Current must be greater than zero.");
  const found = STANDARD_OCPD_AMPS.find((s) => s >= amps);
  if (found === undefined) throw new CalcError("Exceeds the largest standard overcurrent device rating.");
  return found;
}

/** Largest standard rating at or below `amps`; throws below 15 A. */
export function nextStandardOcpdDown(amps: number): number {
  if (!(amps > 0)) throw new CalcError("Current must be greater than zero.");
  let last: number | undefined;
  for (const s of STANDARD_OCPD_AMPS) {
    if (s <= amps) last = s;
    else break;
  }
  if (last === undefined) throw new CalcError("Below the smallest standard overcurrent device rating (15 A).");
  return last;
}
