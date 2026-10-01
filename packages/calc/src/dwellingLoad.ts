import { CalcError, type NecRef } from "./types";

/**
 * Optional calculation for a single dwelling unit served by a 120/240 V or 208Y/120 V
 * 3-wire service of 100 A or more. NEC 220.82.
 */
export interface DwellingLoadInput {
  /** Floor area in square feet, outside dimensions, excluding open porches, garages, unfinished unused spaces. */
  floorAreaSqFt: number;
  /** 20 A small-appliance branch circuits (minimum 2 required by 210.11(C)(1)). */
  smallApplianceCircuits?: number;
  /** 20 A laundry circuits (minimum 1 unless 210.52(F) exceptions apply). */
  laundryCircuits?: number;
  /** Nameplate VA of appliances fastened in place, permanently connected, or on dedicated circuits: ranges, ovens, cooktops, water heater, dishwasher, disposal, dryer, microwave, well pump, etc. */
  appliances: { label: string; va: number }[];
  /** Heating and cooling per 220.82(C); the largest contribution wins. */
  heatingCooling: {
    /** Air-conditioning and cooling equipment nameplate VA, including heat pump compressors. */
    acVa?: number;
    /** Supplemental electric heat used with a heat pump, VA (65% applies when the compressor cannot run with it... conservatively added at 65%). */
    heatPumpSupplementalVa?: number;
    /** Electric space heating nameplate VA (not heat pump supplemental). */
    electricHeatVa?: number;
    /** Separately controlled electric space heating units; four or more lets the 40% factor apply. */
    electricHeatUnits?: number;
    /** Thermal storage or other heating expected to run continuously at full load, VA. */
    continuousHeatVa?: number;
  };
  /** Service voltage for the amps result (default 240). */
  serviceVolts?: number;
}

export interface DwellingLoadResult {
  generalLoadVa: number;
  applianceVa: number;
  /** General + small appliance + laundry + appliances before the demand factor. */
  otherLoadsVa: number;
  /** 100% of first 10 kVA + 40% of the rest. */
  otherLoadsDemandVa: number;
  heatingCoolingVa: number;
  heatingCoolingBasis: string;
  totalVa: number;
  amps: number;
  /** 100 A minimum per 230.79(C), rounded up to a common service size. */
  recommendedServiceAmps: number;
  lines: { label: string; va: number }[];
  refs: NecRef[];
}

const SERVICE_SIZES = [100, 125, 150, 200, 225, 300, 400, 600];

export function dwellingLoadOptional(input: DwellingLoadInput): DwellingLoadResult {
  if (!(input.floorAreaSqFt > 0)) throw new CalcError("Enter the floor area.");
  const sac = input.smallApplianceCircuits ?? 2;
  const laundry = input.laundryCircuits ?? 1;
  if (sac < 2) throw new CalcError("At least two small-appliance circuits are required (210.11(C)(1)).");
  if (laundry < 0 || !Number.isInteger(laundry) || !Number.isInteger(sac)) throw new CalcError("Circuit counts must be whole numbers.");
  for (const a of input.appliances) if (!(a.va >= 0)) throw new CalcError(`${a.label || "An appliance"} has a negative VA.`);
  const volts = input.serviceVolts ?? 240;
  if (!(volts > 0)) throw new CalcError("Service voltage must be greater than zero.");

  const generalLoadVa = 3 * input.floorAreaSqFt;
  const circuitsVa = 1500 * (sac + laundry);
  const applianceVa = input.appliances.reduce((s, a) => s + a.va, 0);
  const otherLoadsVa = generalLoadVa + circuitsVa + applianceVa;
  const otherLoadsDemandVa = otherLoadsVa <= 10000 ? otherLoadsVa : 10000 + 0.4 * (otherLoadsVa - 10000);

  const hc = input.heatingCooling;
  const candidates: { basis: string; va: number }[] = [];
  if (hc.acVa) candidates.push({ basis: "100% of air-conditioning / heat pump compressor", va: hc.acVa });
  if (hc.acVa && hc.heatPumpSupplementalVa) {
    candidates.push({ basis: "100% of heat pump compressor + 65% of supplemental heat", va: hc.acVa + 0.65 * hc.heatPumpSupplementalVa });
  }
  if (hc.electricHeatVa) {
    const units = hc.electricHeatUnits ?? 1;
    const factor = units >= 4 ? 0.4 : 0.65;
    candidates.push({ basis: `${factor * 100}% of electric space heating (${units} unit${units === 1 ? "" : "s"})`, va: factor * hc.electricHeatVa });
  }
  if (hc.continuousHeatVa) candidates.push({ basis: "100% of continuous (thermal storage) heating", va: hc.continuousHeatVa });
  const best = candidates.sort((a, b) => b.va - a.va)[0] ?? { basis: "No heating or cooling entered", va: 0 };

  const totalVa = otherLoadsDemandVa + best.va;
  const amps = totalVa / volts;
  const recommendedServiceAmps = SERVICE_SIZES.find((s) => s >= Math.max(100, amps)) ?? Math.ceil(amps);

  const lines = [
    { label: `General lighting and receptacles, ${input.floorAreaSqFt} sq ft x 3 VA`, va: generalLoadVa },
    { label: `${sac} small-appliance + ${laundry} laundry circuits x 1500 VA`, va: circuitsVa },
    ...input.appliances.map((a) => ({ label: a.label || "Appliance", va: a.va })),
    { label: "Subtotal before demand factor", va: otherLoadsVa },
    { label: "After 100% of first 10 kVA + 40% of remainder", va: otherLoadsDemandVa },
    { label: `Heating/cooling: ${best.basis}`, va: best.va },
  ];

  return {
    generalLoadVa,
    applianceVa,
    otherLoadsVa,
    otherLoadsDemandVa,
    heatingCoolingVa: best.va,
    heatingCoolingBasis: best.basis,
    totalVa,
    amps,
    recommendedServiceAmps,
    lines,
    refs: [
      { section: "220.82(B)", note: "General loads: 3 VA per sq ft, 1500 VA per small-appliance and laundry circuit, nameplate of fastened-in-place and dedicated-circuit appliances; 100% of the first 10 kVA and 40% of the remainder." },
      { section: "220.82(C)", note: "Heating and cooling: take the largest of the listed options, not the sum." },
      { section: "230.79(C)", note: "A one-family dwelling service disconnect is rated at least 100 A." },
      { section: "220.82(A)", note: "Optional method applies to a dwelling unit with a 3-wire, 120/240 V or 208Y/120 V service of 100 A or more." },
    ],
  };
}
