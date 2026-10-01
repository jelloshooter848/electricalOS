import { describe, expect, it } from "vitest";
import { CalcError, sizeForVoltageDrop, voltageDrop, CONDUCTOR_SIZES, sizesFor } from "../src/index";

describe("voltageDrop", () => {
  it("matches the classic single-phase example: 20 A, 100 ft, 12 AWG Cu, 120 V", () => {
    // VD = 2 x 12.9 x 20 x 100 / 6530 = 7.90 V (6.6%)
    const r = voltageDrop({ voltage: 120, amps: 20, lengthFt: 100, size: "12", material: "Cu", phase: 1 });
    expect(r.dropVolts).toBeCloseTo(7.9, 1);
    expect(r.dropPercent).toBeCloseTo(6.58, 1);
    expect(r.voltageAtLoad).toBeCloseTo(112.1, 1);
  });

  it("uses sqrt(3) for three-phase: 100 A, 200 ft, 1 AWG Cu, 208 V", () => {
    // VD = 1.732 x 12.9 x 100 x 200 / 83690 = 5.34 V
    const r = voltageDrop({ voltage: 208, amps: 100, lengthFt: 200, size: "1", material: "Cu", phase: 3 });
    expect(r.dropVolts).toBeCloseTo(5.34, 1);
  });

  it("aluminum drops more than copper for the same size", () => {
    const cu = voltageDrop({ voltage: 240, amps: 50, lengthFt: 150, size: "4", material: "Cu", phase: 1 });
    const al = voltageDrop({ voltage: 240, amps: 50, lengthFt: 150, size: "4", material: "Al", phase: 1 });
    expect(al.dropVolts).toBeGreaterThan(cu.dropVolts);
  });

  it("parallel sets divide the drop", () => {
    const one = voltageDrop({ voltage: 480, amps: 400, lengthFt: 300, size: "500", material: "Cu", phase: 3 });
    const two = voltageDrop({ voltage: 480, amps: 400, lengthFt: 300, size: "500", material: "Cu", phase: 3, parallelSets: 2 });
    expect(two.dropVolts).toBeCloseTo(one.dropVolts / 2, 6);
  });

  it("drop decreases monotonically as conductor size increases", () => {
    let last = Infinity;
    for (const size of CONDUCTOR_SIZES) {
      const r = voltageDrop({ voltage: 240, amps: 100, lengthFt: 200, size, material: "Cu", phase: 1 });
      expect(r.dropVolts).toBeLessThan(last);
      last = r.dropVolts;
    }
  });

  it("rejects bad input", () => {
    expect(() => voltageDrop({ voltage: 0, amps: 1, lengthFt: 1, size: "12", material: "Cu", phase: 1 })).toThrow(CalcError);
    expect(() => voltageDrop({ voltage: 120, amps: -1, lengthFt: 1, size: "12", material: "Cu", phase: 1 })).toThrow(CalcError);
    expect(() => voltageDrop({ voltage: 120, amps: 1, lengthFt: 1, size: "12", material: "Cu", phase: 1, parallelSets: 0 })).toThrow(CalcError);
  });
});

describe("sizeForVoltageDrop", () => {
  it("picks the smallest size under 3% for 20 A, 100 ft, 120 V single-phase Cu", () => {
    // 12 AWG = 6.6%, 10 AWG = 4.1%, 8 AWG = 2.6%
    const r = sizeForVoltageDrop({ voltage: 120, amps: 20, lengthFt: 100, material: "Cu", phase: 1, maxDropPercent: 3 });
    expect(r.size).toBe("8");
    expect(r.dropPercent).toBeLessThanOrEqual(3);
  });

  it("never returns a size smaller than minimumSize", () => {
    const r = sizeForVoltageDrop({ voltage: 480, amps: 10, lengthFt: 10, material: "Cu", phase: 3, maxDropPercent: 3, minimumSize: "6" });
    expect(r.size).toBe("6");
  });

  it("only returns sizes that exist for aluminum", () => {
    const r = sizeForVoltageDrop({ voltage: 120, amps: 15, lengthFt: 20, material: "Al", phase: 1, maxDropPercent: 3 });
    expect(sizesFor("Al")).toContain(r.size);
  });

  it("throws when nothing fits", () => {
    expect(() =>
      sizeForVoltageDrop({ voltage: 120, amps: 500, lengthFt: 5000, material: "Cu", phase: 1, maxDropPercent: 1 }),
    ).toThrow(CalcError);
  });
});
