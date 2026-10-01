import { useMemo, useState } from "react";
import { CalcError, transformer, type Phase, type TransformerInput } from "@electricalos/calc";
import { BigResult, Card, ErrorText, NumberField, References, ResultRow, Screen, Segmented } from "@/components/ui";
import { fmt, num } from "@/num";

type Protection = TransformerInput["protection"];

export default function TransformerScreen() {
  const [phase, setPhase] = useState<Phase>(3);
  const [kva, setKva] = useState("45");
  const [primary, setPrimary] = useState("480");
  const [secondary, setSecondary] = useState("208");
  const [protection, setProtection] = useState<Protection>("primary-and-secondary");

  const result = useMemo(() => {
    const k = num(kva), p = num(primary), s = num(secondary);
    if (![k, p, s].every(Number.isFinite)) return { kind: "error", message: "Enter kVA and both voltages." } as const;
    try {
      return { kind: "ok", data: transformer({ kva: k, primaryVolts: p, secondaryVolts: s, phase, protection }) } as const;
    } catch (e) {
      return { kind: "error", message: e instanceof CalcError ? e.message : "Could not calculate." } as const;
    }
  }, [phase, kva, primary, secondary, protection]);

  return (
    <Screen>
      <Card>
        <Segmented<Phase> label="Transformer" value={phase} onChange={setPhase} options={[{ value: 1, label: "Single-phase" }, { value: 3, label: "Three-phase" }]} />
        <NumberField label="Rating" unit="kVA" value={kva} onChange={setKva} />
        <NumberField label="Primary voltage" unit="V" value={primary} onChange={setPrimary} />
        <NumberField label="Secondary voltage" unit="V" value={secondary} onChange={setSecondary} />
        <Segmented<Protection> label="Protection scheme" value={protection} onChange={setProtection} options={[{ value: "primary-only", label: "Primary only" }, { value: "primary-and-secondary", label: "Primary and secondary" }]} />
      </Card>
      <Card>
        {result.kind === "error" && <ErrorText message={result.message} />}
        {result.kind === "ok" && (
          <>
            <BigResult label="Max primary OCPD" value={`${result.data.primaryOcpd.standardAmps} A`} />
            <ResultRow label="Primary rated current" value={`${fmt(result.data.primaryAmps, 1)} A`} />
            <ResultRow label={`Primary limit (${result.data.primaryOcpd.percent}%)`} value={`${fmt(result.data.primaryOcpd.maxAmps, 1)} A${result.data.primaryOcpd.nextSizeUpPermitted ? ", next size up OK" : ", round down"}`} />
            <ResultRow label="Secondary rated current" value={`${fmt(result.data.secondaryAmps, 1)} A`} />
            {result.data.secondaryOcpd && (
              <>
                <ResultRow label={`Secondary limit (${result.data.secondaryOcpd.percent}%)`} value={`${fmt(result.data.secondaryOcpd.maxAmps, 1)} A${result.data.secondaryOcpd.nextSizeUpPermitted ? ", next size up OK" : ", round down"}`} />
                <ResultRow label="Max secondary OCPD" value={`${result.data.secondaryOcpd.standardAmps} A`} />
              </>
            )}
            <References refs={result.data.refs} />
          </>
        )}
      </Card>
    </Screen>
  );
}
