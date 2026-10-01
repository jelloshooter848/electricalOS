import { describe, expect, it } from "vitest";
import { CalcError, equipmentGroundingConductor, groundingElectrodeConductor, sizesFor } from "../src/index";

describe("groundingElectrodeConductor", () => {
  it("2/0 Cu service -> 4 Cu or 2 Al GEC", () => {
    expect(groundingElectrodeConductor({ serviceConductorSize: "2/0", serviceConductorMaterial: "Cu", gecMaterial: "Cu" }).size).toBe("4");
    expect(groundingElectrodeConductor({ serviceConductorSize: "2/0", serviceConductorMaterial: "Cu", gecMaterial: "Al" }).size).toBe("2");
  });
  it("4/0 Al service -> 4 Cu", () => {
    expect(groundingElectrodeConductor({ serviceConductorSize: "4/0", serviceConductorMaterial: "Al", gecMaterial: "Cu" }).size).toBe("4");
  });
  it("two parallel 500 kcmil Cu -> 2/0 Cu", () => {
    const r = groundingElectrodeConductor({ serviceConductorSize: "500", serviceConductorMaterial: "Cu", parallelSets: 2, gecMaterial: "Cu" });
    expect(r.equivalentCmil).toBe(1000000);
    expect(r.size).toBe("2/0");
  });
  it("rod electrode caps at 6 Cu; concrete-encased at 4 Cu", () => {
    const base = { serviceConductorSize: "500" as const, serviceConductorMaterial: "Cu" as const, gecMaterial: "Cu" as const };
    expect(groundingElectrodeConductor({ ...base, electrode: "rod-pipe-plate" }).size).toBe("6");
    expect(groundingElectrodeConductor({ ...base, electrode: "concrete-encased" }).size).toBe("4");
    expect(groundingElectrodeConductor({ ...base, electrode: "ground-ring", groundRingSize: "2" }).size).toBe("2");
    expect(() => groundingElectrodeConductor({ ...base, electrode: "ground-ring" })).toThrow(CalcError);
  });
  it("caps never enlarge a small table size", () => {
    expect(groundingElectrodeConductor({ serviceConductorSize: "2", serviceConductorMaterial: "Cu", gecMaterial: "Cu", electrode: "rod-pipe-plate" }).size).toBe("8");
  });
  it("is monotonic in service conductor size", () => {
    const order = sizesFor("Cu");
    let last = -1;
    for (const s of order) {
      const idx = order.indexOf(groundingElectrodeConductor({ serviceConductorSize: s, serviceConductorMaterial: "Cu", gecMaterial: "Cu" }).size);
      expect(idx).toBeGreaterThanOrEqual(last);
      last = idx;
    }
  });
});

describe("equipmentGroundingConductor", () => {
  it("common breaker sizes", () => {
    expect(equipmentGroundingConductor({ ocpdAmps: 20, material: "Cu" }).size).toBe("12");
    expect(equipmentGroundingConductor({ ocpdAmps: 100, material: "Cu" }).size).toBe("8");
    expect(equipmentGroundingConductor({ ocpdAmps: 150, material: "Cu" }).size).toBe("6");
    expect(equipmentGroundingConductor({ ocpdAmps: 225, material: "Cu" }).size).toBe("4");
    expect(equipmentGroundingConductor({ ocpdAmps: 200, material: "Al" }).size).toBe("4");
  });
  it("rounds odd ratings up to a standard device first", () => {
    const r = equipmentGroundingConductor({ ocpdAmps: 17, material: "Cu" });
    expect(r.ocpdAmps).toBe(20);
    expect(r.size).toBe("12");
  });
  it("rejects nonsense and out-of-table values", () => {
    expect(() => equipmentGroundingConductor({ ocpdAmps: 0, material: "Cu" })).toThrow(CalcError);
    expect(() => equipmentGroundingConductor({ ocpdAmps: 5000, material: "Cu" })).toThrow(CalcError);
  });
});
