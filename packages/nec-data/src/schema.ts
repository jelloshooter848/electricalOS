/**
 * Reference entry schema. Every entry is original wording written by us that
 * explains what a section requires and cites it. Entries never contain text
 * copied from NFPA 70. See docs/content-style-guide.md.
 */
export type NecEdition = 2020 | 2023 | 2026;

export interface ReferenceEntry {
  /** Stable id, e.g. "310.16" or "chapter9.table1". */
  id: string;
  edition: NecEdition;
  /** Article or section number as printed in that edition, e.g. "310.16". */
  section: string;
  /** Short title in our words. */
  title: string;
  /** Plain-language explanation in our words, 1-4 sentences. */
  summary: string;
  /** Practical field notes, gotchas, common inspector calls. Our words. */
  fieldNotes?: string[];
  /** Related section ids in the same edition. */
  related?: string[];
  /** Calculator ids in the app that apply this section. */
  calculators?: string[];
  /** Search keywords beyond the title. */
  keywords?: string[];
  /** Section number in the prior edition if it moved, for cross-edition lookup. */
  priorSection?: string;
}

export function isReferenceEntry(x: unknown): x is ReferenceEntry {
  if (typeof x !== "object" || x === null) return false;
  const e = x as Record<string, unknown>;
  return (
    typeof e["id"] === "string" &&
    (e["edition"] === 2020 || e["edition"] === 2023 || e["edition"] === 2026) &&
    typeof e["section"] === "string" &&
    typeof e["title"] === "string" &&
    typeof e["summary"] === "string"
  );
}
