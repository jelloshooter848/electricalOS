import { CalcError, type NecRef } from "./types";

/** Conductor sizes that box fill covers (Table 314.16(B)). */
export const BOX_FILL_SIZES = ["18", "16", "14", "12", "10", "8", "6"] as const;
export type BoxFillSize = (typeof BOX_FILL_SIZES)[number];

/**
 * Volume allowance per conductor, cubic inches. NEC Table 314.16(B).
 * DATA STATUS: transcribed from memory; verify before release.
 */
export const VOLUME_PER_CONDUCTOR_IN3: Record<BoxFillSize, number> = {
  "18": 1.5,
  "16": 1.75,
  "14": 2.0,
  "12": 2.25,
  "10": 2.5,
  "8": 3.0,
  "6": 5.0,
};

/**
 * A few common trade boxes and their marked/table volumes, cubic inches (Table 314.16(A)).
 * Use the volume marked on the box when it differs. DATA STATUS: verify before release.
 */
export const COMMON_BOXES: { label: string; volumeIn3: number }[] = [
  { label: '4 x 1-1/4 round or octagon', volumeIn3: 12.5 },
  { label: '4 x 1-1/2 round or octagon', volumeIn3: 15.5 },
  { label: '4 x 2-1/8 round or octagon', volumeIn3: 21.5 },
  { label: '4 x 1-1/4 square', volumeIn3: 18.0 },
  { label: '4 x 1-1/2 square', volumeIn3: 21.0 },
  { label: '4 x 2-1/8 square', volumeIn3: 30.3 },
  { label: '4-11/16 x 1-1/2 square', volumeIn3: 29.5 },
  { label: '4-11/16 x 2-1/8 square', volumeIn3: 42.0 },
  { label: '3 x 2 x 2 device', volumeIn3: 10.0 },
  { label: '3 x 2 x 2-1/4 device', volumeIn3: 10.5 },
  { label: '3 x 2 x 2-1/2 device', volumeIn3: 12.5 },
  { label: '3 x 2 x 2-3/4 device', volumeIn3: 14.0 },
  { label: '3 x 2 x 3-1/2 device', volumeIn3: 18.0 },
  { label: '4 x 2-1/8 x 1-1/2 device', volumeIn3: 10.3 },
  { label: '4 x 2-1/8 x 1-7/8 device', volumeIn3: 13.0 },
  { label: '4 x 2-1/8 x 2-1/8 device', volumeIn3: 14.5 },
];

export interface BoxConductorGroup {
  size: BoxFillSize;
  /** Conductors that enter the box and terminate or splice inside, plus unbroken pass-throughs. */
  count: number;
  /** Loops or coils of unbroken conductor long enough to count twice (314.16(B)(1)). */
  longLoops?: number;
}

export interface BoxFillInput {
  conductors: BoxConductorGroup[];
  /** Number of equipment grounding conductors entering the box (314.16(B)(5)). */
  equipmentGroundingConductors?: number;
  /** Size of the largest EGC, used for its allowance (default: largest conductor present). */
  largestEgcSize?: BoxFillSize;
  /** One or more internal cable clamps present (314.16(B)(2)). */
  internalClamps?: boolean;
  /** Luminaire studs or hickeys, each counted once (314.16(B)(3)). */
  supportFittings?: number;
  /** Device yokes or straps; each counts as two conductors of the largest size connected to it (314.16(B)(4)). */
  deviceYokes?: number;
  /** Largest conductor connected to a device, for the device allowance (default: largest conductor present). */
  largestDeviceConductor?: BoxFillSize;
  /** Box volume to check against, cubic inches (marked on the box or Table 314.16(A)). */
  boxVolumeIn3?: number;
}

export interface BoxFillResult {
  /** Allowances in conductor-equivalents by size, plus the volume each contributes. */
  lines: { label: string; allowances: number; size: BoxFillSize; volumeIn3: number }[];
  requiredVolumeIn3: number;
  boxVolumeIn3: number | undefined;
  compliant: boolean | undefined;
  refs: NecRef[];
}

function largest(sizes: BoxFillSize[]): BoxFillSize {
  let best = sizes[0];
  if (best === undefined) throw new CalcError("Add at least one conductor.");
  for (const s of sizes) if (BOX_FILL_SIZES.indexOf(s) > BOX_FILL_SIZES.indexOf(best)) best = s;
  return best;
}

export function boxFill(input: BoxFillInput): BoxFillResult {
  const groups = input.conductors.filter((g) => g.count > 0 || (g.longLoops ?? 0) > 0);
  if (groups.length === 0) throw new CalcError("Add at least one conductor.");
  for (const g of groups) {
    if (!Number.isInteger(g.count) || g.count < 0) throw new CalcError("Conductor counts must be whole numbers.");
    if (g.longLoops !== undefined && (!Number.isInteger(g.longLoops) || g.longLoops < 0)) throw new CalcError("Loop counts must be whole numbers.");
  }
  const largestSize = largest(groups.map((g) => g.size));
  const lines: BoxFillResult["lines"] = [];
  const refs: NecRef[] = [{ section: "314.16(B)(1)", note: "One allowance per conductor that enters and terminates or passes through; long unbroken loops count twice." }];

  for (const g of groups) {
    const allowances = g.count + 2 * (g.longLoops ?? 0);
    if (allowances > 0) lines.push({ label: `${g.size} AWG conductors`, allowances, size: g.size, volumeIn3: allowances * VOLUME_PER_CONDUCTOR_IN3[g.size] });
  }
  if (input.internalClamps) {
    lines.push({ label: "Internal cable clamps", allowances: 1, size: largestSize, volumeIn3: VOLUME_PER_CONDUCTOR_IN3[largestSize] });
    refs.push({ section: "314.16(B)(2)", note: "One allowance for internal clamps, based on the largest conductor in the box." });
  }
  const fittings = input.supportFittings ?? 0;
  if (fittings > 0) {
    lines.push({ label: "Support fittings (studs, hickeys)", allowances: fittings, size: largestSize, volumeIn3: fittings * VOLUME_PER_CONDUCTOR_IN3[largestSize] });
    refs.push({ section: "314.16(B)(3)", note: "One allowance per stud or hickey, based on the largest conductor in the box." });
  }
  const yokes = input.deviceYokes ?? 0;
  if (yokes > 0) {
    const devSize = input.largestDeviceConductor ?? largestSize;
    lines.push({ label: "Device yokes", allowances: 2 * yokes, size: devSize, volumeIn3: 2 * yokes * VOLUME_PER_CONDUCTOR_IN3[devSize] });
    refs.push({ section: "314.16(B)(4)", note: "Two allowances per yoke or strap, based on the largest conductor connected to the device." });
  }
  const egcs = input.equipmentGroundingConductors ?? 0;
  if (egcs > 0) {
    const egcSize = input.largestEgcSize ?? largestSize;
    const allowances = 1 + Math.max(0, egcs - 4) * 0.25;
    lines.push({ label: "Equipment grounding conductors", allowances, size: egcSize, volumeIn3: allowances * VOLUME_PER_CONDUCTOR_IN3[egcSize] });
    refs.push({ section: "314.16(B)(5)", note: "Up to four EGCs share one allowance based on the largest; each additional EGC adds a quarter allowance." });
  }
  const requiredVolumeIn3 = lines.reduce((s, l) => s + l.volumeIn3, 0);
  refs.push({ section: "Table 314.16(B)", note: "Volume per conductor by size." });
  const box = input.boxVolumeIn3;
  if (box !== undefined) {
    if (!(box > 0)) throw new CalcError("Box volume must be greater than zero.");
    refs.push({ section: "314.16(A)", note: "Box volume is the marked volume or the Table 314.16(A) value, plus any marked extension rings or covers." });
  }
  return {
    lines,
    requiredVolumeIn3,
    boxVolumeIn3: box,
    compliant: box === undefined ? undefined : box + 1e-9 >= requiredVolumeIn3,
    refs,
  };
}
