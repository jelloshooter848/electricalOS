import entries2023 from "../data/2023/entries.json";
import { isReferenceEntry, type NecEdition, type ReferenceEntry } from "./schema";

export * from "./schema";

const ALL: ReferenceEntry[] = [...(entries2023 as ReferenceEntry[])];

export function entriesFor(edition: NecEdition): ReferenceEntry[] {
  return ALL.filter((e) => e.edition === edition);
}

export function findEntry(edition: NecEdition, id: string): ReferenceEntry | undefined {
  return ALL.find((e) => e.edition === edition && e.id === id);
}

/** Very small keyword search; good enough for offline lookup and for picking context for the AI assistant. */
export function searchEntries(edition: NecEdition, query: string, limit = 5): ReferenceEntry[] {
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
  if (terms.length === 0) return [];
  const scored = entriesFor(edition).map((e) => {
    const hay = [e.section, e.title, e.summary, ...(e.keywords ?? []), ...(e.fieldNotes ?? [])].join(" ").toLowerCase();
    const score = terms.reduce((s, t) => s + (hay.includes(t) ? 1 : 0) + (e.section.toLowerCase().includes(t) ? 2 : 0), 0);
    return { e, score };
  });
  return scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.e);
}

export function validateAll(): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const e of ALL) {
    if (!isReferenceEntry(e)) problems.push(`Malformed entry: ${JSON.stringify(e).slice(0, 80)}`);
    const key = `${e.edition}:${e.id}`;
    if (seen.has(key)) problems.push(`Duplicate id ${key}`);
    seen.add(key);
  }
  return problems;
}

export * from "./jurisdictions";
