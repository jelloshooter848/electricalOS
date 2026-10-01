import data from "../data/jurisdictions.json";
import type { NecEdition } from "./schema";

export interface Jurisdiction {
  code: string;
  name: string;
  edition: NecEdition;
  /** false when adoption is by county/city rather than statewide. */
  statewide?: boolean;
}

export const JURISDICTIONS_AS_OF: string = data.asOf;
export const JURISDICTIONS: Jurisdiction[] = data.states as Jurisdiction[];

export function findJurisdiction(code: string): Jurisdiction | undefined {
  return JURISDICTIONS.find((j) => j.code === code);
}
