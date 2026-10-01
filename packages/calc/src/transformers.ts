import { nextStandardOcpdDown, nextStandardOcpdUp } from "./ocpd";
import { CalcError, type NecRef, type Phase } from "./types";

export interface TransformerInput {
  kva: number;
  primaryVolts: number;
  secondaryVolts: number;
  phase: Phase;
  /** Protection scheme per Table 450.3(B). */
  protection: "primary-only" | "primary-and-secondary";
}

export interface OcpdLimit {
  /** Percent of rated current permitted. */
  percent: number;
  /** Rated current x percent. */
  maxAmps: number;
  /** Standard device: next size up when permitted, else next size down. */
  standardAmps: number;
  nextSizeUpPermitted: boolean;
}

export interface TransformerResult {
  primaryAmps: number;
  secondaryAmps: number;
  primaryOcpd: OcpdLimit;
  secondaryOcpd: OcpdLimit | undefined;
  refs: NecRef[];
}

function ratedCurrent(kva: number, volts: number, phase: Phase): number {
  return (kva * 1000) / (volts * (phase === 3 ? Math.sqrt(3) : 1));
}

function limit(amps: number, percent: number, nextUp: boolean): OcpdLimit {
  const maxAmps = (amps * percent) / 100;
  let standardAmps: number;
  if (nextUp) standardAmps = nextStandardOcpdUp(maxAmps);
  else {
    try {
      standardAmps = nextStandardOcpdDown(maxAmps);
    } catch {
      standardAmps = nextStandardOcpdUp(maxAmps); // below 15 A: a 15 A device is the practical floor
    }
  }
  return { percent, maxAmps, standardAmps, nextSizeUpPermitted: nextUp };
}

/**
 * Currents and overcurrent limits for transformers rated 1000 V and less,
 * NEC Table 450.3(B). Primary-only: 125% at 9 A or more (next size up allowed),
 * 167% from 2 A to under 9 A, 300% under 2 A. Primary and secondary:
 * primary 250%, secondary 125% at 9 A or more (next size up allowed) or 167% under 9 A.
 */
export function transformer(input: TransformerInput): TransformerResult {
  const { kva, primaryVolts, secondaryVolts, phase } = input;
  if (!(kva > 0)) throw new CalcError("kVA must be greater than zero.");
  if (!(primaryVolts > 0) || !(secondaryVolts > 0)) throw new CalcError("Voltages must be greater than zero.");
  if (primaryVolts > 1000 || secondaryVolts > 1000) throw new CalcError("This calculator covers transformers rated 1000 V and less (Table 450.3(B)).");
  const primaryAmps = ratedCurrent(kva, primaryVolts, phase);
  const secondaryAmps = ratedCurrent(kva, secondaryVolts, phase);
  const refs: NecRef[] = [{ section: "Table 450.3(B)", note: "Maximum overcurrent protection for transformers 1000 V and less." }];

  let primaryOcpd: OcpdLimit;
  let secondaryOcpd: OcpdLimit | undefined;
  if (input.protection === "primary-only") {
    if (primaryAmps >= 9) primaryOcpd = limit(primaryAmps, 125, true);
    else if (primaryAmps >= 2) primaryOcpd = limit(primaryAmps, 167, false);
    else primaryOcpd = limit(primaryAmps, 300, false);
    refs.push({ section: "450.3(B) Note 1", note: "Where 125% does not land on a standard rating, the next higher standard rating is permitted." });
  } else {
    primaryOcpd = limit(primaryAmps, 250, false);
    secondaryOcpd = secondaryAmps >= 9 ? limit(secondaryAmps, 125, true) : limit(secondaryAmps, 167, false);
    refs.push({ section: "450.3(B) Note 1", note: "Secondary at 125% may go to the next higher standard rating; the 250% primary may not." });
  }
  refs.push({ section: "240.21(C)", note: "Secondary conductors need their own protection or must meet a tap rule; transformer primary protection does not protect them except for 2-wire or 3-wire delta-delta single-voltage cases." });
  return { primaryAmps, secondaryAmps, primaryOcpd, secondaryOcpd, refs };
}
