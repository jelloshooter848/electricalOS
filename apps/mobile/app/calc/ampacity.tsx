import { useMemo, useState } from "react";
import {
  CalcError,
  conductorAmpacity,
  sizeConductor,
  sizesFor,
  type ConductorSize,
  type InsulationTempC,
  type Material,
  type TerminationTempC,
} from "@electricalos/calc";
import { SizePicker } from "@/components/SizePicker";
import { BigResult, Card, ErrorText, NumberField, References, ResultRow, Screen, Segmented } from "@/components/ui";
import { fmt, num } from "@/num";

type Mode = "ampacity" | "size";

export default function AmpacityScreen() {
  const [mode, setMode] = useState<Mode>("size");
  const [material, setMaterial] = useState<Material>("Cu");
  const [insulation, setInsulation] = useState<InsulationTempC>(90);
  const [termination, setTermination] = useState<TerminationTempC>(75);
  const [size, setSize] = useState<ConductorSize>("8");
  const [ambient, setAmbient] = useState("30");
  const [ccc, setCcc] = useState("3");
  const [continuous, setContinuous] = useState("40");
  const [noncontinuous, setNoncontinuous] = useState("0");

  const sizes = sizesFor(material);
  const result = useMemo(() => {
    const amb = num(ambient), n = num(ccc);
    if (!Number.isFinite(amb) || !Number.isFinite(n)) return { kind: "error", message: "Enter ambient temperature and conductor count." } as const;
    const common = { material, insulationTempC: insulation, terminationTempC: termination, ambientC: amb, currentCarryingConductors: n };
    try {
      if (mode === "ampacity") return { kind: "amp", data: conductorAmpacity({ ...common, size }) } as const;
      const c = num(continuous), nc = num(noncontinuous);
      if (!Number.isFinite(c) || !Number.isFinite(nc)) return { kind: "error", message: "Enter the continuous and noncontinuous load." } as const;
      return { kind: "size", data: sizeConductor({ ...common, continuousAmps: c, noncontinuousAmps: nc }) } as const;
    } catch (e) {
      return { kind: "error", message: e instanceof CalcError ? e.message : "Could not calculate." } as const;
    }
  }, [mode, material, insulation, termination, size, ambient, ccc, continuous, noncontinuous]);

  const r = result.kind === "amp" || result.kind === "size" ? result.data : null;

  return (
    <Screen>
      <Card>
        <Segmented<Mode> label="Mode" value={mode} onChange={setMode} options={[{ value: "size", label: "Size for a load" }, { value: "ampacity", label: "Ampacity of a size" }]} />
        <Segmented<Material> label="Conductor" value={material} onChange={(m) => { setMaterial(m); if (!sizesFor(m).includes(size)) setSize(sizesFor(m)[0]!); }} options={[{ value: "Cu", label: "Copper" }, { value: "Al", label: "Aluminum" }]} />
        <Segmented<InsulationTempC> label="Insulation rating" value={insulation} onChange={setInsulation} options={[{ value: 60, label: "60 C (TW)" }, { value: 75, label: "75 C (THW, THWN)" }, { value: 90, label: "90 C (THHN, XHHW-2)" }]} />
        <Segmented<TerminationTempC> label="Termination rating" value={termination} onChange={setTermination} options={[{ value: 60, label: "60 C" }, { value: 75, label: "75 C" }]} />
        {mode === "ampacity" ? (
          <SizePicker label="Size (AWG / kcmil)" sizes={sizes} value={size} onChange={setSize} />
        ) : (
          <>
            <NumberField label="Continuous load" unit="A" value={continuous} onChange={setContinuous} />
            <NumberField label="Noncontinuous load" unit="A" value={noncontinuous} onChange={setNoncontinuous} />
          </>
        )}
        <NumberField label="Ambient temperature" unit="C" value={ambient} onChange={setAmbient} />
        <NumberField label="Current-carrying conductors in raceway" value={ccc} onChange={setCcc} />
      </Card>
      <Card>
        {result.kind === "error" && <ErrorText message={result.message} />}
        {r && (
          <>
            {result.kind === "size" ? (
              <BigResult label="Minimum conductor" value={`${result.data.size} ${material}`} />
            ) : (
              <BigResult label="Allowable ampacity" value={`${fmt(r.allowableAmpacity, 0)} A`} />
            )}
            {result.kind === "size" && <ResultRow label="Required before adjustment" value={`${fmt(result.data.requiredBeforeAdjustment, 1)} A`} />}
            <ResultRow label={`Table 310.16, ${insulation} C column`} value={`${r.tableAmpacity} A`} />
            <ResultRow label="Ambient correction" value={`x ${r.ambientFactor.toFixed(2)}`} />
            <ResultRow label="Bundling adjustment" value={`x ${r.bundlingFactor.toFixed(2)}`} />
            <ResultRow label="Adjusted ampacity" value={`${fmt(r.adjustedAmpacity, 1)} A`} />
            <ResultRow label="Termination limit" value={`${r.terminationAmpacity} A`} />
            {r.smallConductorOcpdMax !== undefined && <ResultRow label="Max overcurrent device (240.4(D))" value={`${r.smallConductorOcpdMax} A`} />}
            <References refs={r.refs} />
          </>
        )}
      </Card>
    </Screen>
  );
}
