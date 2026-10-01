import { describe, expect, it } from "vitest";
import { entriesFor, findEntry, searchEntries, validateAll } from "../src/index";

describe("nec-data", () => {
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
});
