import { CIRCULAR_MILS } from "./conductors";
import { nextStandardOcpdUp } from "./ocpd";
import { CONDUCTOR_SIZES, CalcError, type ConductorSize, type Material, type NecRef } from "./types";

/**
 * Grounding electrode conductor by size of the largest ungrounded service-entrance
 * conductor (or equivalent area for parallel sets). NEC Table 250.66.
 * Thresholds are the upper bound of each row in circular mils.
 * DATA STATUS: transcribed from memory; verify before release.
 */
interface GecRow { maxCmilCu: number; maxCmilAl: number; gecCu: ConductorSize; gecAl: ConductorSize }
const GEC_ROWS: GecRow[] = [
  { maxCmilCu: 66360, maxCmilAl: 105600, gecCu: "8", gecAl: "6" },        // 2 Cu / 1/0 Al or smaller
  { maxCmilCu: 105600, maxCmilAl: 167800, gecCu: "6", gecAl: "4" },       // 1 or 1/0 Cu / 2/0 or 3/0 Al
  { maxCmilCu: 167800, maxCmilAl: 250000, gecCu: "4", gecAl: "2" },       // 2/0 or 3/0 Cu / 4/0 or 250 Al
  { maxCmilCu: 350000, maxCmilAl: 500000, gecCu: "2", gecAl: "1/0" },     // over 3/0 to 350 Cu / over 250 to 500 Al
  { maxCmilCu: 600000, maxCmilAl: 900000, gecCu: "1/0", gecAl: "3/0" },   // over 350 to 600 Cu / over 500 to 900 Al
  { maxCmilCu: 1100000, maxCmilAl: 1750000, gecCu: "2/0", gecAl: "4/0" }, // over 600 to 1100 Cu / over 900 to 1750 Al
  { maxCmilCu: Infinity, maxCmilAl: Infinity, gecCu: "3/0", gecAl: "250" },
];

export type ElectrodeType = "other" | "rod-pipe-plate" | "concrete-encased" | "ground-ring";

export interface GecInput {
  /** Largest ungrounded service conductor per set. */
  serviceConductorSize: ConductorSize;
  serviceConductorMaterial: Material;
  /** Parallel sets per phase (default 1); areas are added. */
  parallelSets?: number;
  /** Material wanted for the GEC. */
  gecMaterial: Material;
  /** Electrode the GEC connects to; rods, concrete-encased and rings have size caps. */
  electrode?: ElectrodeType;
  /** Ground ring conductor size, needed only when electrode is "ground-ring". */
  groundRingSize?: ConductorSize;
}

export interface GecResult {
  /** Table 250.66 size before electrode caps. */
  tableSize: ConductorSize;
  /** Size after the 250.66(A)-(C) caps for the electrode type. */
  size: ConductorSize;
  equivalentCmil: number;
  refs: NecRef[];
}

/** Pick the smaller of two sizes using the canonical NEC order (never Object.keys: numeric-looking keys get reordered). */
function smaller(a: ConductorSize, b: ConductorSize): ConductorSize {
  return CONDUCTOR_SIZES.indexOf(a) <= CONDUCTOR_SIZES.indexOf(b) ? a : b;
}

export function groundingElectrodeConductor(input: GecInput): GecResult {
  const sets = input.parallelSets ?? 1;
  if (!Number.isInteger(sets) || sets < 1) throw new CalcError("Parallel sets must be a whole number of 1 or more.");
  const cmil = CIRCULAR_MILS[input.serviceConductorSize] * sets;
  const row = GEC_ROWS.find((r) => cmil <= (input.serviceConductorMaterial === "Cu" ? r.maxCmilCu : r.maxCmilAl));
  if (!row) throw new CalcError("Service conductor size is outside Table 250.66.");
  const tableSize = input.gecMaterial === "Cu" ? row.gecCu : row.gecAl;
  const refs: NecRef[] = [
    { section: "Table 250.66", note: `GEC sized from the ${sets > 1 ? "combined area of the parallel" : "largest"} ungrounded service conductor${sets > 1 ? "s" : ""}.` },
  ];
  let size = tableSize;
  const electrode = input.electrode ?? "other";
  if (electrode === "rod-pipe-plate") {
    const cap: ConductorSize = input.gecMaterial === "Cu" ? "6" : "4";
    size = smaller(size, cap);
    refs.push({ section: "250.66(A)", note: `Sole connection to rod, pipe or plate electrodes: GEC need not be larger than ${cap} AWG ${input.gecMaterial}.` });
  } else if (electrode === "concrete-encased") {
    const cap: ConductorSize = input.gecMaterial === "Cu" ? "4" : "2";
    size = smaller(size, cap);
    refs.push({ section: "250.66(B)", note: `Sole connection to a concrete-encased electrode: GEC need not be larger than ${cap} AWG ${input.gecMaterial}.` });
  } else if (electrode === "ground-ring") {
    if (!input.groundRingSize) throw new CalcError("Enter the ground ring conductor size.");
    size = smaller(size, input.groundRingSize);
    refs.push({ section: "250.66(C)", note: "Sole connection to a ground ring: GEC need not be larger than the ring conductor." });
  }
  return { tableSize, size, equivalentCmil: cmil, refs };
}

/**
 * Minimum equipment grounding conductor by rating of the overcurrent device ahead of the
 * circuit. NEC Table 250.122. DATA STATUS: transcribed from memory; verify before release.
 */
const EGC_ROWS: { maxOcpd: number; cu: ConductorSize; al: ConductorSize }[] = [
  { maxOcpd: 15, cu: "14", al: "12" },
  { maxOcpd: 20, cu: "12", al: "10" },
  { maxOcpd: 60, cu: "10", al: "8" },
  { maxOcpd: 100, cu: "8", al: "6" },
  { maxOcpd: 200, cu: "6", al: "4" },
  { maxOcpd: 300, cu: "4", al: "2" },
  { maxOcpd: 400, cu: "3", al: "1" },
  { maxOcpd: 500, cu: "2", al: "1/0" },
  { maxOcpd: 600, cu: "1", al: "2/0" },
  { maxOcpd: 800, cu: "1/0", al: "3/0" },
  { maxOcpd: 1000, cu: "2/0", al: "4/0" },
  { maxOcpd: 1200, cu: "3/0", al: "250" },
  { maxOcpd: 1600, cu: "4/0", al: "350" },
  { maxOcpd: 2000, cu: "250", al: "400" },
  { maxOcpd: 2500, cu: "350", al: "600" },
  { maxOcpd: 3000, cu: "400", al: "600" },
];

export interface EgcInput {
  /** Rating of the overcurrent device, amps. Non-standard values are rounded up to the next standard rating first. */
  ocpdAmps: number;
  material: Material;
}

export interface EgcResult {
  ocpdAmps: number;
  size: ConductorSize;
  refs: NecRef[];
}

export function equipmentGroundingConductor(input: EgcInput): EgcResult {
  const ocpd = nextStandardOcpdUp(input.ocpdAmps);
  const row = EGC_ROWS.find((r) => ocpd <= r.maxOcpd);
  if (!row) throw new CalcError("Table 250.122 rows above 3000 A are not included in this calculator.");
  return {
    ocpdAmps: ocpd,
    size: input.material === "Cu" ? row.cu : row.al,
    refs: [
      { section: "Table 250.122", note: `Minimum EGC for a ${ocpd} A overcurrent device.` },
      { section: "250.122(B)", note: "If the ungrounded conductors were upsized for voltage drop, increase the EGC in proportion to the circular-mil increase." },
    ],
  };
}
