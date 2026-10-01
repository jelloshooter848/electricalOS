import { describe, expect, it } from "vitest";
import {
  CalcError,
  ambientCorrectionFactor,
  bundlingAdjustmentFactor,
  conductorAmpacity,
  defaultTerminationTemp,
  sizeConductor,
  sizesFor,
} from "../src/index";

describe("ambientCorrectionFactor", () => {
  it("reproduces table values for the 90 C column", () => {
    expect(ambientCorrectionFactor(90, 30)).toBe(1);
    expect(ambientCorrectionFactor(90, 40)).toBe(0.91);
    expect(ambientCorrectionFactor(90, 45)).toBe(0.87);
    expect(ambientCorrectionFactor(90, 50)).toBe(0.82);
  });
  it("reproduces table values for the 75 C column", () => {
    expect(ambientCorrectionFactor(75, 40)).toBe(0.88);
    expect(ambientCorrectionFactor(75, 50)).toBe(0.75);
  });
  it("is above 1 for cool ambients and 0 at or above the rating", () => {
    expect(ambientCorrectionFactor(90, 20)).toBe(1.08);
    expect(ambientCorrectionFactor(75, 75)).toBe(0);
    expect(ambientCorrectionFactor(60, 65)).toBe(0);
  });
});

describe("bundlingAdjustmentFactor", () => {
  it("follows 310.15(C)(1) bands", () => {
    expect(bundlingAdjustmentFactor(3)).toBe(1);
    expect(bundlingAdjustmentFactor(4)).toBe(0.8);
    expect(bundlingAdjustmentFactor(6)).toBe(0.8);
    expect(bundlingAdjustmentFactor(7)).toBe(0.7);
    expect(bundlingAdjustmentFactor(10)).toBe(0.5);
    expect(bundlingAdjustmentFactor(21)).toBe(0.45);
    expect(bundlingAdjustmentFactor(31)).toBe(0.4);
    expect(bundlingAdjustmentFactor(41)).toBe(0.35);
  });
  it("rejects non-integers", () => {
    expect(() => bundlingAdjustmentFactor(2.5)).toThrow(CalcError);
  });
});

describe("defaultTerminationTemp", () => {
  it("is 60 C at or below 100 A and 75 C above", () => {
    expect(defaultTerminationTemp(100)).toBe(60);
    expect(defaultTerminationTemp(101)).toBe(75);
  });
});

describe("conductorAmpacity", () => {
  it("8 AWG THHN Cu, 4 current-carrying, 45 C ambient, 60 C terminations", () => {
    // 55 x 0.87 x 0.8 = 38.28; termination column 60 C = 40; allowable = 38.28
    const r = conductorAmpacity({ size: "8", material: "Cu", insulationTempC: 90, ambientC: 45, currentCarryingConductors: 4, terminationTempC: 60 });
    expect(r.tableAmpacity).toBe(55);
    expect(r.adjustedAmpacity).toBeCloseTo(38.28, 2);
    expect(r.terminationAmpacity).toBe(40);
    expect(r.allowableAmpacity).toBeCloseTo(38.28, 2);
  });

  it("termination limit governs when no derating applies", () => {
    // 12 AWG THHN Cu: 90 C column is 30, but 60 C terminations limit to 20, and 240.4(D) caps OCPD at 20
    const r = conductorAmpacity({ size: "12", material: "Cu", insulationTempC: 90, terminationTempC: 60 });
    expect(r.allowableAmpacity).toBe(20);
    expect(r.smallConductorOcpdMax).toBe(20);
  });

  it("termination column never exceeds the insulation rating", () => {
    // 60 C insulation with 75 C terminations must still use the 60 C column
    const r = conductorAmpacity({ size: "6", material: "Cu", insulationTempC: 60, terminationTempC: 75 });
    expect(r.terminationAmpacity).toBe(55);
  });

  it("refuses sizes not made in aluminum", () => {
    expect(() => conductorAmpacity({ size: "14", material: "Al", insulationTempC: 75 })).toThrow(CalcError);
  });

  it("cites the sections it used", () => {
    const r = conductorAmpacity({ size: "8", material: "Cu", insulationTempC: 90, ambientC: 45, currentCarryingConductors: 4, terminationTempC: 60 });
    const sections = r.refs.map((x) => x.section);
    expect(sections).toEqual(expect.arrayContaining(["310.16", "310.15(B)(1)", "310.15(C)(1)", "110.14(C)"]));
  });
});

describe("sizeConductor", () => {
  it("100 A continuous, THHN Cu, 75 C terminations, 30 C, 3 CCC -> 1 AWG", () => {
    // Needs 125 A in the 75 C column: 1 AWG = 130 A. Adjusted 90 C = 145 >= 100.
    const r = sizeConductor({ material: "Cu", insulationTempC: 90, terminationTempC: 75, continuousAmps: 100 });
    expect(r.size).toBe("1");
    expect(r.requiredBeforeAdjustment).toBe(125);
  });

  it("100 A continuous with 60 C terminations needs 1/0 AWG", () => {
    // 60 C column: 1 AWG = 110 (too small), 1/0 = 125.
    const r = sizeConductor({ material: "Cu", insulationTempC: 90, terminationTempC: 60, continuousAmps: 100 });
    expect(r.size).toBe("1/0");
  });

  it("derating can force a larger size than terminations alone", () => {
    // 40 A continuous, 8 THHN Cu: 75 C col 50 >= 50 ok, but 9 CCC at 45 C: 55 x 0.87 x 0.7 = 33.5 < 40 -> go up.
    const r = sizeConductor({ material: "Cu", insulationTempC: 90, terminationTempC: 75, continuousAmps: 40, ambientC: 45, currentCarryingConductors: 9 });
    expect(r.size).toBe("6");
  });

  it("is monotonic: more load never yields a smaller conductor", () => {
    const sizes = sizesFor("Cu");
    let lastIdx = -1;
    for (let amps = 5; amps <= 400; amps += 5) {
      const r = sizeConductor({ material: "Cu", insulationTempC: 75, terminationTempC: 75, continuousAmps: amps });
      const idx = sizes.indexOf(r.size);
      expect(idx).toBeGreaterThanOrEqual(lastIdx);
      lastIdx = idx;
    }
  });

  it("rejects zero and negative loads and impossible loads", () => {
    expect(() => sizeConductor({ material: "Cu", insulationTempC: 75, continuousAmps: 0 })).toThrow(CalcError);
    expect(() => sizeConductor({ material: "Cu", insulationTempC: 75, continuousAmps: -5 })).toThrow(CalcError);
    expect(() => sizeConductor({ material: "Cu", insulationTempC: 75, continuousAmps: 2000 })).toThrow(CalcError);
  });
});
