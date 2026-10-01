import { describe, expect, it } from "vitest";
import { CalcError, TRADE_SIZES, checkConduitFill, maxFillPercent, minimumConduitSize } from "../src/index";

describe("maxFillPercent", () => {
  it("follows Chapter 9 Table 1 and Note 4", () => {
    expect(maxFillPercent(1)).toBe(53);
    expect(maxFillPercent(2)).toBe(31);
    expect(maxFillPercent(3)).toBe(40);
    expect(maxFillPercent(12)).toBe(40);
    expect(maxFillPercent(12, true)).toBe(60);
  });
});

describe("minimumConduitSize", () => {
  it("nine 12 AWG THHN fit in 1/2 inch EMT", () => {
    // 9 x 0.0133 = 0.1197 <= 40% of 0.304 = 0.1216
    const r = minimumConduitSize({ conductors: [{ size: "12", insulation: "THHN", count: 9 }], conduitType: "EMT" });
    expect(r.tradeSize).toBe("1/2");
    expect(r.fillPercent).toBeLessThanOrEqual(40);
  });

  it("ten 12 AWG THHN need 3/4 inch EMT", () => {
    const r = minimumConduitSize({ conductors: [{ size: "12", insulation: "THHN", count: 10 }], conduitType: "EMT" });
    expect(r.tradeSize).toBe("3/4");
  });

  it("three 500 kcmil plus one 1/0 THHN fit in 2-1/2 inch EMT", () => {
    // 3 x 0.7073 + 0.1855 = 2.3074 <= 40% of 5.858 = 2.3432
    const r = minimumConduitSize({
      conductors: [
        { size: "500", insulation: "THHN", count: 3 },
        { size: "1/0", insulation: "THHN", count: 1 },
      ],
      conduitType: "EMT",
    });
    expect(r.tradeSize).toBe("2-1/2");
    expect(r.totalConductorAreaIn2).toBeCloseTo(2.3074, 4);
  });

  it("a nipple allows 60% fill", () => {
    const conductors = [{ size: "12" as const, insulation: "THHN" as const, count: 13 }];
    const normal = minimumConduitSize({ conductors, conduitType: "EMT" });
    const nipple = minimumConduitSize({ conductors, conduitType: "EMT", isNipple: true });
    expect(normal.tradeSize).toBe("3/4");
    expect(nipple.tradeSize).toBe("1/2");
  });

  it("PVC Schedule 80 needs a larger trade size than EMT for the same fill", () => {
    const conductors = [{ size: "12" as const, insulation: "THHN" as const, count: 9 }];
    expect(minimumConduitSize({ conductors, conduitType: "EMT" }).tradeSize).toBe("1/2");
    expect(minimumConduitSize({ conductors, conduitType: "PVC80" }).tradeSize).toBe("3/4");
  });

  it("is monotonic: adding conductors never yields a smaller conduit", () => {
    let lastIdx = -1;
    for (let n = 1; n <= 60; n++) {
      const r = minimumConduitSize({ conductors: [{ size: "10", insulation: "THWN", count: n }], conduitType: "RMC" });
      const idx = TRADE_SIZES.indexOf(r.tradeSize);
      expect(idx).toBeGreaterThanOrEqual(lastIdx);
      lastIdx = idx;
    }
  });

  it("throws when nothing fits or nothing is entered", () => {
    expect(() => minimumConduitSize({ conductors: [{ size: "1000", insulation: "THHN", count: 40 }], conduitType: "EMT" })).toThrow(CalcError);
    expect(() => minimumConduitSize({ conductors: [], conduitType: "EMT" })).toThrow(CalcError);
  });
});

describe("checkConduitFill", () => {
  it("reports non-compliance for an overfilled raceway", () => {
    const r = checkConduitFill({ conductors: [{ size: "12", insulation: "THHN", count: 10 }], conduitType: "EMT", tradeSize: "1/2" });
    expect(r.compliant).toBe(false);
    expect(r.fillPercent).toBeGreaterThan(40);
  });
  it("rejects sizes not made in that conduit type", () => {
    expect(() => checkConduitFill({ conductors: [{ size: "12", insulation: "THHN", count: 1 }], conduitType: "EMT", tradeSize: "6" })).toThrow(CalcError);
  });
});
