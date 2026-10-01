import { describe, expect, it } from "vitest";
import { CalcError, ampsToKva, kwToAmps, solvePower } from "../src/index";

describe("solvePower", () => {
  it("single-phase volts and amps give VA and watts", () => {
    const r = solvePower({ phase: 1, volts: 240, amps: 20 });
    expect(r.va).toBe(4800);
    expect(r.watts).toBe(4800);
  });
  it("three-phase uses sqrt(3)", () => {
    const r = solvePower({ phase: 3, volts: 480, amps: 100 });
    expect(r.va).toBeCloseTo(83138, 0);
  });
  it("solves amps from watts with power factor", () => {
    const r = solvePower({ phase: 1, volts: 120, watts: 1200, powerFactor: 0.8 });
    expect(r.va).toBeCloseTo(1500, 6);
    expect(r.amps).toBeCloseTo(12.5, 6);
  });
  it("solves volts from amps and VA", () => {
    expect(solvePower({ phase: 1, amps: 10, va: 2400 }).volts).toBe(240);
  });
  it("rejects bad power factor and missing inputs", () => {
    expect(() => solvePower({ phase: 1, volts: 120, amps: 1, powerFactor: 1.2 })).toThrow(CalcError);
    expect(() => solvePower({ phase: 1, volts: 120 })).toThrow(CalcError);
  });
  it("helpers", () => {
    expect(kwToAmps(4.8, 240, 1)).toBe(20);
    expect(ampsToKva(20, 240, 1)).toBe(4.8);
  });
});
