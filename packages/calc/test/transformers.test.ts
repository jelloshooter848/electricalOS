import { describe, expect, it } from "vitest";
import { CalcError, transformer } from "../src/index";

describe("transformer", () => {
  const t = { kva: 45, primaryVolts: 480, secondaryVolts: 208, phase: 3 as const };
  it("45 kVA 480-208Y three-phase currents", () => {
    const r = transformer({ ...t, protection: "primary-only" });
    expect(r.primaryAmps).toBeCloseTo(54.1, 1);
    expect(r.secondaryAmps).toBeCloseTo(124.9, 1);
  });
  it("primary-only: 125% with next size up -> 70 A", () => {
    const r = transformer({ ...t, protection: "primary-only" });
    expect(r.primaryOcpd.percent).toBe(125);
    expect(r.primaryOcpd.standardAmps).toBe(70);
    expect(r.secondaryOcpd).toBeUndefined();
  });
  it("primary and secondary: 250% primary rounds down, 125% secondary rounds up", () => {
    const r = transformer({ ...t, protection: "primary-and-secondary" });
    expect(r.primaryOcpd.percent).toBe(250);
    expect(r.primaryOcpd.standardAmps).toBe(125); // 135.3 -> down to 125
    expect(r.secondaryOcpd?.percent).toBe(125);
    expect(r.secondaryOcpd?.standardAmps).toBe(175); // 156.1 -> up to 175
  });
  it("small primaries use 167% and 300% bands", () => {
    // 1 kVA 480 V single-phase: 2.08 A -> 167% band, 3.48 A -> rounds down fails below 15, so 15 A floor
    const small = transformer({ kva: 1, primaryVolts: 480, secondaryVolts: 120, phase: 1, protection: "primary-only" });
    expect(small.primaryOcpd.percent).toBe(167);
    expect(small.primaryOcpd.standardAmps).toBe(15);
    const tiny = transformer({ kva: 0.5, primaryVolts: 480, secondaryVolts: 120, phase: 1, protection: "primary-only" });
    expect(tiny.primaryOcpd.percent).toBe(300);
  });
  it("rejects over 1000 V and bad inputs", () => {
    expect(() => transformer({ ...t, primaryVolts: 4160, protection: "primary-only" })).toThrow(CalcError);
    expect(() => transformer({ ...t, kva: 0, protection: "primary-only" })).toThrow(CalcError);
  });
});
