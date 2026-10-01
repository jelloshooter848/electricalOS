import { describe, expect, it } from "vitest";
import { CalcError, motorBranchCircuit, motorFeederAmps, motorFullLoadCurrent, SINGLE_PHASE_HP, THREE_PHASE_HP } from "../src/index";

describe("motorFullLoadCurrent", () => {
  it("table values", () => {
    expect(motorFullLoadCurrent({ phase: 1, hp: "5", volts: 230 })).toBe(28);
    expect(motorFullLoadCurrent({ phase: 1, hp: "1", volts: 115 })).toBe(16);
    expect(motorFullLoadCurrent({ phase: 3, hp: "10", volts: 460 })).toBe(14);
    expect(motorFullLoadCurrent({ phase: 3, hp: "50", volts: 230 })).toBe(130);
  });
  it("FLC rises with hp and falls with voltage", () => {
    let last = 0;
    for (const hp of SINGLE_PHASE_HP) {
      const f = motorFullLoadCurrent({ phase: 1, hp, volts: 230 });
      expect(f).toBeGreaterThan(last);
      last = f;
    }
    last = 0;
    for (const hp of THREE_PHASE_HP) {
      const f = motorFullLoadCurrent({ phase: 3, hp, volts: 460 });
      expect(f).toBeGreaterThan(last);
      last = f;
    }
    expect(motorFullLoadCurrent({ phase: 3, hp: "25", volts: 460 })).toBeLessThan(motorFullLoadCurrent({ phase: 3, hp: "25", volts: 230 }));
  });
});

describe("motorBranchCircuit", () => {
  it("5 hp 230 V single-phase, inverse-time breaker: 35 A conductor, 70 A breaker", () => {
    const r = motorBranchCircuit({ motor: { phase: 1, hp: "5", volts: 230 }, device: "inverse-time-breaker" });
    expect(r.flc).toBe(28);
    expect(r.conductorAmps).toBe(35);
    expect(r.maxOcpdCalculated).toBe(70);
    expect(r.maxOcpdStandard).toBe(70);
  });
  it("dual-element fuse 175% rounds up to the next standard size", () => {
    const r = motorBranchCircuit({ motor: { phase: 1, hp: "5", volts: 230 }, device: "dual-element-fuse" });
    expect(r.maxOcpdCalculated).toBe(49);
    expect(r.maxOcpdStandard).toBe(50);
  });
  it("10 hp 460 V three-phase breaker 35 A", () => {
    const r = motorBranchCircuit({ motor: { phase: 3, hp: "10", volts: 460 }, device: "inverse-time-breaker" });
    expect(r.conductorAmps).toBeCloseTo(17.5, 6);
    expect(r.maxOcpdStandard).toBe(35);
  });
});

describe("motorFeederAmps", () => {
  it("125% of largest plus the rest", () => {
    expect(motorFeederAmps([28, 14, 7.6]).amps).toBeCloseTo(28 * 1.25 + 14 + 7.6, 6);
  });
  it("rejects empty and non-positive", () => {
    expect(() => motorFeederAmps([])).toThrow(CalcError);
    expect(() => motorFeederAmps([0])).toThrow(CalcError);
  });
});
