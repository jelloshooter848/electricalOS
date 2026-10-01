import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { NecEdition } from "@electricalos/nec-data";

export interface Settings {
  edition: NecEdition;
  /** Two-letter state code, or "" when not set. */
  jurisdiction: string;
}

interface SettingsContextValue {
  settings: Settings;
  /** False until the saved settings have been read from disk. */
  ready: boolean;
  setEdition: (e: NecEdition) => void;
  setJurisdiction: (code: string, edition?: NecEdition) => void;
}

const STORAGE_KEY = "electricalos.settings.v1";
const DEFAULTS: Settings = { edition: 2023, jurisdiction: "" };

const SettingsContext = createContext<SettingsContextValue | null>(null);

function isSettings(x: unknown): x is Settings {
  if (typeof x !== "object" || x === null) return false;
  const s = x as Record<string, unknown>;
  return (s["edition"] === 2020 || s["edition"] === 2023 || s["edition"] === 2026) && typeof s["jurisdiction"] === "string";
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        const parsed: unknown = JSON.parse(raw);
        if (isSettings(parsed)) setSettings(parsed);
      })
      .catch(() => {
        /* corrupt or unavailable storage: keep defaults */
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch(() => {
      /* best effort */
    });
  }, [settings, ready]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      ready,
      setEdition: (edition) => setSettings((s) => ({ ...s, edition })),
      setJurisdiction: (jurisdiction, edition) => setSettings((s) => ({ ...s, jurisdiction, edition: edition ?? s.edition })),
    }),
    [settings, ready],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const v = useContext(SettingsContext);
  if (!v) throw new Error("useSettings must be used inside SettingsProvider");
  return v;
}
