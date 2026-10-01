import { useMemo, useState } from "react";
import { CalcError, solvePower, type Phase } from "@electricalos/calc";
import { BigResult, Card, ErrorText, NumberField, References, ResultRow, Screen, Segmented } from "@/components/ui";
import { fmt, num } from "@/num";

type Known = "volts-amps" | "volts-watts" | "volts-va" | "amps-watts";

export default function PowerScreen() {
  const [phase, setPhase] = useState<Phase>(1);
  const [known, setKnown] = useState<Known>("volts-amps");
  const [volts, setVolts] = useState("240");
  const [amps, setAmps] = useState("20");
  const [watts, setWatts] = useState("4800");
  const [va, setVa] = useState("4800");
  const [pf, setPf] = useState("1");

  const result = useMemo(() => {
    const p = num(pf);
    if (!Number.isFinite(p)) return { kind: "error", message: "Enter a power factor between 0 and 1." } as const;
    const v = num(volts), a = num(amps), w = num(watts), s = num(va);
    try {
      const data =
        known === "volts-amps" ? solvePower({ phase, volts: v, amps: a, powerFactor: p })
        : known === "volts-watts" ? solvePower({ phase, volts: v, watts: w, powerFactor: p })
        : known === "volts-va" ? solvePower({ phase, volts: v, va: s, powerFactor: p })
        : solvePower({ phase, amps: a, watts: w, powerFactor: p });
      if (!Number.isFinite(data.volts) || !Number.isFinite(data.amps)) return { kind: "error", message: "Enter numbers for the two known values." } as const;
      return { kind: "ok", data } as const;
    } catch (e) {
      return { kind: "error", message: e instanceof CalcError ? e.message : "Could not calculate." } as const;
    }
  }, [phase, known, volts, amps, watts, va, pf]);

  const showVolts = known !== "amps-watts";
  const showAmps = known === "volts-amps" || known === "amps-watts";
  const showWatts = known === "volts-watts" || known === "amps-watts";
  const showVa = known === "volts-va";

  return (
    <Screen>
      <Card>
        <Segmented<Phase> label="System" value={phase} onChange={setPhase} options={[{ value: 1, label: "Single-phase" }, { value: 3, label: "Three-phase" }]} />
        <Segmented<Known> label="I know" value={known} onChange={setKnown} options={[{ value: "volts-amps", label: "V and A" }, { value: "volts-watts", label: "V and W" }, { value: "volts-va", label: "V and VA" }, { value: "amps-watts", label: "A and W" }]} />
        {showVolts && <NumberField label="Voltage" unit="V" value={volts} onChange={setVolts} />}
        {showAmps && <NumberField label="Current" unit="A" value={amps} onChange={setAmps} />}
        {showWatts && <NumberField label="Real power" unit="W" value={watts} onChange={setWatts} />}
        {showVa && <NumberField label="Apparent power" unit="VA" value={va} onChange={setVa} />}
        <NumberField label="Power factor" value={pf} onChange={setPf} />
      </Card>
      <Card>
        {result.kind === "error" && <ErrorText message={result.message} />}
        {result.kind === "ok" && (
          <>
            <BigResult label={showAmps ? "Apparent power" : "Current"} value={showAmps ? `${fmt(result.data.va / 1000, 2)} kVA` : `${fmt(result.data.amps, 1)} A`} />
            <ResultRow label="Volts" value={`${fmt(result.data.volts, 1)} V`} />
            <ResultRow label="Amps" value={`${fmt(result.data.amps, 2)} A`} />
            <ResultRow label="Watts" value={`${fmt(result.data.watts, 0)} W`} />
            <ResultRow label="Volt-amperes" value={`${fmt(result.data.va, 0)} VA`} />
            <References refs={result.data.refs} />
          </>
        )}
      </Card>
    </Screen>
  );
}
