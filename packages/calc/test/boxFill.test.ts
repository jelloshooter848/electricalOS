import { describe, expect, it } from "vitest";
import { CalcError, boxFill } from "../src/index";

describe("boxFill", () => {
  it("two 12-2 NM cables, one receptacle, internal clamps = 18.0 cu in", () => {
    // 4 x 12 AWG (9.0) + EGCs (2.25) + clamps (2.25) + device 2 x 2.25 (4.5) = 18.0
    const r = boxFill({
      conductors: [{ size: "12", count: 4 }],
      equipmentGroundingConductors: 2,
      internalClamps: true,
      deviceYokes: 1,
      boxVolumeIn3: 18,
    });
    expect(r.requiredVolumeIn3).toBe(18);
    expect(r.compliant).toBe(true);
  });
  it("flags an undersized box", () => {
    const r = boxFill({ conductors: [{ size: "12", count: 4 }], equipmentGroundingConductors: 2, internalClamps: true, deviceYokes: 1, boxVolumeIn3: 14 });
    expect(r.compliant).toBe(false);
  });
  it("mixed sizes use the largest for clamps and devices", () => {
    // 2 x 14 (4.0) + 2 x 12 (4.5) + clamps at 12 (2.25) + 1 EGC at 12 (2.25) = 13.0
    const r = boxFill({ conductors: [{ size: "14", count: 2 }, { size: "12", count: 2 }], internalClamps: true, equipmentGroundingConductors: 1 });
    expect(r.requiredVolumeIn3).toBe(13);
  });
  it("more than four EGCs add a quarter each", () => {
    const four = boxFill({ conductors: [{ size: "12", count: 1 }], equipmentGroundingConductors: 4 }).requiredVolumeIn3;
    const six = boxFill({ conductors: [{ size: "12", count: 1 }], equipmentGroundingConductors: 6 }).requiredVolumeIn3;
    expect(six - four).toBeCloseTo(0.5 * 2.25, 6);
  });
  it("long loops count twice", () => {
    const r = boxFill({ conductors: [{ size: "14", count: 0, longLoops: 1 }] });
    expect(r.requiredVolumeIn3).toBe(4);
  });
  it("rejects empty input and bad volumes", () => {
    expect(() => boxFill({ conductors: [] })).toThrow(CalcError);
    expect(() => boxFill({ conductors: [{ size: "12", count: 1 }], boxVolumeIn3: 0 })).toThrow(CalcError);
  });
});
