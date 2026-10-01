import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { NecEdition } from "@electricalos/nec-data";

export interface Settings {
  edition: NecEdition;
  /** US state or "" when not set. Used later for amendments and AI grounding. */
  jurisdiction: string;
}

interface SettingsContextValue {
  settings: Settings;
  setEdition: (e: NecEdition) => void;
  setJurisdiction: (j: string) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

/** In-memory for Phase 1. Persistence (expo-sqlite or async storage) comes with the offline reference work. */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>({ edition: 2023, jurisdiction: "" });
  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      setEdition: (edition) => setSettings((s) => ({ ...s, edition })),
      setJurisdiction: (jurisdiction) => setSettings((s) => ({ ...s, jurisdiction })),
    }),
    [settings],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const v = useContext(SettingsContext);
  if (!v) throw new Error("useSettings must be used inside SettingsProvider");
  return v;
}
