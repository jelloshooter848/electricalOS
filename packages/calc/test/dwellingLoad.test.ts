import { describe, expect, it } from "vitest";
import { CalcError, dwellingLoadOptional } from "../src/index";

const house = {
  floorAreaSqFt: 2000,
  smallApplianceCircuits: 2,
  laundryCircuits: 1,
  appliances: [
    { label: "Range", va: 12000 },
    { label: "Dryer", va: 5000 },
    { label: "Water heater", va: 4500 },
    { label: "Dishwasher", va: 1200 },
    { label: "Disposal", va: 900 },
  ],
};

describe("dwellingLoadOptional", () => {
  it("2000 sq ft house with A/C and one electric furnace -> 125 A service", () => {
    // other: 6000 + 4500 + 23600 = 34100 -> 10000 + 0.4 x 24100 = 19640
    // heat/cool: max(5000 A/C, 65% x 10000 heat = 6500) = 6500 -> 26140 VA -> 108.9 A
    const r = dwellingLoadOptional({ ...house, heatingCooling: { acVa: 5000, electricHeatVa: 10000, electricHeatUnits: 1 } });
    expect(r.otherLoadsVa).toBe(34100);
    expect(r.otherLoadsDemandVa).toBe(19640);
    expect(r.heatingCoolingVa).toBe(6500);
    expect(r.totalVa).toBe(26140);
    expect(r.amps).toBeCloseTo(108.9, 1);
    expect(r.recommendedServiceAmps).toBe(125);
  });
  it("four or more heating units use 40%", () => {
    const r = dwellingLoadOptional({ ...house, heatingCooling: { electricHeatVa: 10000, electricHeatUnits: 4 } });
    expect(r.heatingCoolingVa).toBe(4000);
  });
  it("heat pump with supplemental heat adds 65% of the strips", () => {
    const r = dwellingLoadOptional({ ...house, heatingCooling: { acVa: 4000, heatPumpSupplementalVa: 10000 } });
    expect(r.heatingCoolingVa).toBe(4000 + 6500);
  });
  it("small loads still get a 100 A service", () => {
    const r = dwellingLoadOptional({ floorAreaSqFt: 800, appliances: [], heatingCooling: {} });
    expect(r.recommendedServiceAmps).toBe(100);
    expect(r.otherLoadsDemandVa).toBe(r.otherLoadsVa); // under 10 kVA, no reduction
  });
  it("rejects too few small-appliance circuits and bad area", () => {
    expect(() => dwellingLoadOptional({ ...house, smallApplianceCircuits: 1, heatingCooling: {} })).toThrow(CalcError);
    expect(() => dwellingLoadOptional({ ...house, floorAreaSqFt: 0, heatingCooling: {} })).toThrow(CalcError);
  });
});
