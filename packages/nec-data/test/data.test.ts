import { describe, expect, it } from "vitest";
import { JURISDICTIONS, entriesFor, findEntry, findJurisdiction, searchEntries, validateAll } from "../src/index";

const CALCULATOR_IDS = ["voltage-drop", "ampacity", "conduit-fill", "box-fill", "motor", "dwelling-load", "grounding", "transformer", "power"];

describe("nec-data entries", () => {
  it("has no malformed or duplicate entries", () => {
    expect(validateAll()).toEqual([]);
  });
  it("finds entries by id and by keyword", () => {
    expect(findEntry(2023, "310.16")?.title).toMatch(/ampacity/i);
    const hits = searchEntries(2023, "conduit fill");
    expect(hits[0]?.id).toBe("chapter9.table1");
  });
  it("every related id resolves", () => {
    for (const e of entriesFor(2023)) {
      for (const r of e.related ?? []) expect(findEntry(2023, r), `${e.id} -> ${r}`).toBeDefined();
    }
  });
  it("every calculator id matches a real screen", () => {
    for (const e of entriesFor(2023)) {
      for (const c of e.calculators ?? []) expect(CALCULATOR_IDS, `${e.id} -> ${c}`).toContain(c);
    }
  });
  it("entries have enough keywords and a readable summary", () => {
    for (const e of entriesFor(2023)) {
      expect(e.keywords?.length ?? 0, `${e.id} keywords`).toBeGreaterThanOrEqual(2);
      expect(e.summary.length, `${e.id} summary`).toBeGreaterThan(80);
      expect(e.title.length, `${e.id} title`).toBeLessThanOrEqual(70);
    }
  });
});

describe("jurisdictions", () => {
  it("covers 50 states plus DC with valid editions", () => {
    expect(JURISDICTIONS).toHaveLength(51);
    const codes = new Set(JURISDICTIONS.map((j) => j.code));
    expect(codes.size).toBe(51);
    for (const j of JURISDICTIONS) expect([2020, 2023, 2026]).toContain(j.edition);
  });
  it("looks up by code", () => {
    expect(findJurisdiction("TX")?.name).toBe("Texas");
    expect(findJurisdiction("ZZ")).toBeUndefined();
  });
});
