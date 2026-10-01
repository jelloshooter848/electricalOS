import { nextStandardOcpdUp } from "./ocpd";
import { CalcError, type NecRef, type Phase } from "./types";

/** Horsepower ratings listed in the FLC tables, as strings so fractions display cleanly. */
export const SINGLE_PHASE_HP = ["1/6", "1/4", "1/3", "1/2", "3/4", "1", "1-1/2", "2", "3", "5", "7-1/2", "10"] as const;
export const THREE_PHASE_HP = ["1/2", "3/4", "1", "1-1/2", "2", "3", "5", "7-1/2", "10", "15", "20", "25", "30", "40", "50", "60", "75", "100", "125", "150", "200"] as const;
export type SinglePhaseHp = (typeof SINGLE_PHASE_HP)[number];
export type ThreePhaseHp = (typeof THREE_PHASE_HP)[number];

export type SinglePhaseVolts = 115 | 200 | 208 | 230;
export type ThreePhaseVolts = 200 | 208 | 230 | 460 | 575;

/**
 * Full-load current, single-phase AC motors, NEC Table 430.248. Columns 115/200/208/230 V.
 * DATA STATUS: transcribed from memory; verify before release.
 */
const FLC_1PH: Record<SinglePhaseHp, Record<SinglePhaseVolts, number>> = {
  "1/6": { 115: 4.4, 200: 2.5, 208: 2.4, 230: 2.2 },
  "1/4": { 115: 5.8, 200: 3.3, 208: 3.2, 230: 2.9 },
  "1/3": { 115: 7.2, 200: 4.1, 208: 4.0, 230: 3.6 },
  "1/2": { 115: 9.8, 200: 5.6, 208: 5.4, 230: 4.9 },
  "3/4": { 115: 13.8, 200: 7.9, 208: 7.6, 230: 6.9 },
  "1": { 115: 16, 200: 9.2, 208: 8.8, 230: 8 },
  "1-1/2": { 115: 20, 200: 11.5, 208: 11, 230: 10 },
  "2": { 115: 24, 200: 13.8, 208: 13.2, 230: 12 },
  "3": { 115: 34, 200: 19.6, 208: 18.7, 230: 17 },
  "5": { 115: 56, 200: 32.2, 208: 30.8, 230: 28 },
  "7-1/2": { 115: 80, 200: 46, 208: 44, 230: 40 },
  "10": { 115: 100, 200: 57.5, 208: 55, 230: 50 },
};

/**
 * Full-load current, three-phase squirrel-cage induction motors, NEC Table 430.250.
 * Columns 200/208/230/460/575 V. DATA STATUS: transcribed from memory; verify before release.
 */
const FLC_3PH: Record<ThreePhaseHp, Record<ThreePhaseVolts, number>> = {
  "1/2": { 200: 2.5, 208: 2.4, 230: 2.2, 460: 1.1, 575: 0.9 },
  "3/4": { 200: 3.7, 208: 3.5, 230: 3.2, 460: 1.6, 575: 1.3 },
  "1": { 200: 4.8, 208: 4.6, 230: 4.2, 460: 2.1, 575: 1.7 },
  "1-1/2": { 200: 6.9, 208: 6.6, 230: 6.0, 460: 3.0, 575: 2.4 },
  "2": { 200: 7.8, 208: 7.5, 230: 6.8, 460: 3.4, 575: 2.7 },
  "3": { 200: 11, 208: 10.6, 230: 9.6, 460: 4.8, 575: 3.9 },
  "5": { 200: 17.5, 208: 16.7, 230: 15.2, 460: 7.6, 575: 6.1 },
  "7-1/2": { 200: 25.3, 208: 24.2, 230: 22, 460: 11, 575: 9 },
  "10": { 200: 32.2, 208: 30.8, 230: 28, 460: 14, 575: 11 },
  "15": { 200: 48.3, 208: 46.2, 230: 42, 460: 21, 575: 17 },
  "20": { 200: 62.1, 208: 59.4, 230: 54, 460: 27, 575: 22 },
  "25": { 200: 78.2, 208: 74.8, 230: 68, 460: 34, 575: 27 },
  "30": { 200: 92, 208: 88, 230: 80, 460: 40, 575: 32 },
  "40": { 200: 120, 208: 114, 230: 104, 460: 52, 575: 41 },
  "50": { 200: 150, 208: 143, 230: 130, 460: 65, 575: 52 },
  "60": { 200: 177, 208: 169, 230: 154, 460: 77, 575: 62 },
  "75": { 200: 221, 208: 211, 230: 192, 460: 96, 575: 77 },
  "100": { 200: 285, 208: 273, 230: 248, 460: 124, 575: 99 },
  "125": { 200: 359, 208: 343, 230: 312, 460: 156, 575: 125 },
  "150": { 200: 414, 208: 396, 230: 360, 460: 180, 575: 144 },
  "200": { 200: 552, 208: 528, 230: 480, 460: 240, 575: 192 },
};

export type MotorSpec =
  | { phase: 1; hp: SinglePhaseHp; volts: SinglePhaseVolts }
  | { phase: 3; hp: ThreePhaseHp; volts: ThreePhaseVolts };

/** Table full-load current used for conductor and OCPD sizing (430.6(A)(1)). */
export function motorFullLoadCurrent(m: MotorSpec): number {
  const flc = m.phase === 1 ? FLC_1PH[m.hp]?.[m.volts] : FLC_3PH[m.hp]?.[m.volts];
  if (flc === undefined) throw new CalcError("That horsepower and voltage combination is not in the FLC tables.");
  return flc;
}

export type MotorOcpdDevice = "inverse-time-breaker" | "dual-element-fuse" | "nontime-delay-fuse" | "instantaneous-trip-breaker";

/** Percent of FLC, Table 430.52 for AC single-phase and polyphase squirrel-cage motors (not Design B energy-efficient instantaneous trip). */
export const MOTOR_OCPD_PERCENT: Record<MotorOcpdDevice, number> = {
  "nontime-delay-fuse": 300,
  "dual-element-fuse": 175,
  "instantaneous-trip-breaker": 800,
  "inverse-time-breaker": 250,
};

export const MOTOR_OCPD_LABEL: Record<MotorOcpdDevice, string> = {
  "inverse-time-breaker": "Inverse-time breaker",
  "dual-element-fuse": "Dual-element time-delay fuse",
  "nontime-delay-fuse": "Nontime-delay fuse",
  "instantaneous-trip-breaker": "Instantaneous-trip breaker",
};

export interface MotorCircuitInput {
  motor: MotorSpec;
  device: MotorOcpdDevice;
}

export interface MotorCircuitResult {
  flc: number;
  /** Minimum branch-circuit conductor ampacity, 125% of FLC (430.22). */
  conductorAmps: number;
  /** FLC x Table 430.52 percent. */
  maxOcpdCalculated: number;
  /** Next standard size at or above the calculated value (430.52(C)(1) Exception No. 1). */
  maxOcpdStandard: number;
  refs: NecRef[];
}

export function motorBranchCircuit(input: MotorCircuitInput): MotorCircuitResult {
  const flc = motorFullLoadCurrent(input.motor);
  const pct = MOTOR_OCPD_PERCENT[input.device];
  const maxOcpdCalculated = (flc * pct) / 100;
  const tableRef = input.motor.phase === 1 ? "Table 430.248" : "Table 430.250";
  return {
    flc,
    conductorAmps: flc * 1.25,
    maxOcpdCalculated,
    maxOcpdStandard: nextStandardOcpdUp(maxOcpdCalculated),
    refs: [
      { section: tableRef, note: "Table full-load current is used for sizing, not the nameplate (430.6(A)(1))." },
      { section: "430.22", note: "Branch-circuit conductors for a single continuous-duty motor: at least 125% of FLC." },
      { section: "Table 430.52", note: `${MOTOR_OCPD_LABEL[input.device]}: up to ${pct}% of FLC for short-circuit and ground-fault protection.` },
      { section: "430.52(C)(1) Exception No. 1", note: "When the percentage does not match a standard rating, the next higher standard rating is permitted." },
      { section: "430.32", note: "Overload protection is separate: typically 115% to 125% of nameplate current, not covered here." },
    ],
  };
}

/** Feeder conductor minimum for several motors: 125% of the largest FLC plus the sum of the others (430.24). */
export function motorFeederAmps(flcs: number[]): { amps: number; refs: NecRef[] } {
  if (flcs.length === 0) throw new CalcError("Add at least one motor.");
  if (flcs.some((f) => !(f > 0))) throw new CalcError("Each motor FLC must be greater than zero.");
  const sorted = [...flcs].sort((a, b) => b - a);
  const largest = sorted[0]!;
  const rest = sorted.slice(1).reduce((s, f) => s + f, 0);
  return { amps: largest * 1.25 + rest, refs: [{ section: "430.24", note: "Feeder for several motors: 125% of the largest motor FLC plus the full-load currents of the rest." }] };
}
