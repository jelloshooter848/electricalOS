/** Shared types for all calculators. */

export type Material = "Cu" | "Al";
export type Phase = 1 | 3;

/** NEC editions the app supports. Data tables are keyed by edition where they differ. */
export type NecEdition = 2020 | 2023 | 2026;

/** AWG / kcmil conductor sizes in NEC order, smallest to largest. */
export const CONDUCTOR_SIZES = [
  "14", "12", "10", "8", "6", "4", "3", "2", "1",
  "1/0", "2/0", "3/0", "4/0",
  "250", "300", "350", "400", "500", "600", "700", "750", "800", "900", "1000",
] as const;
export type ConductorSize = (typeof CONDUCTOR_SIZES)[number];

export function sizeIndex(size: ConductorSize): number {
  return CONDUCTOR_SIZES.indexOf(size);
}

/** Every result carries the NEC references it relied on so the UI can cite them. */
export interface NecRef {
  /** e.g. "310.16", "Chapter 9 Table 4", "215.2(A)(1) Informational Note No. 2" */
  section: string;
  /** Short, original-wording note on how the section was applied. Never code text. */
  note: string;
}

export class CalcError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CalcError";
  }
}
