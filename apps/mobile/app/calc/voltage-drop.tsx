import { useMemo, useState } from "react";
import { CalcError, sizeForVoltageDrop, sizesFor, voltageDrop, type ConductorSize, type Material, type Phase } from "@electricalos/calc";
import { SizePicker } from "@/components/SizePicker";
import { BigResult, Card, ErrorText, NumberField, References, ResultRow, Screen, Segmented } from "@/components/ui";
import { fmt, num } from "@/num";

type Mode = "check" | "find";

export default function VoltageDropScreen() {
  const [mode, setMode] = useState<Mode>("check");
  const [voltage, setVoltage] = useState("120");
  const [amps, setAmps] = useState("20");
  const [lengthFt, setLengthFt] = useState("100");
  const [phase, setPhase] = useState<Phase>(1);
  const [material, setMaterial] = useState<Material>("Cu");
  const [size, setSize] = useState<ConductorSize>("12");
  const [maxDrop, setMaxDrop] = useState("3");

  const sizes = sizesFor(material);
  const result = useMemo(() => {
    const v = num(voltage), a = num(amps), l = num(lengthFt);
    if ([v, a, l].some((x) => !Number.isFinite(x))) return { kind: "error", message: "Enter voltage, current and length." } as const;
    try {
      if (mode === "check") {
        return { kind: "check", data: voltageDrop({ voltage: v, amps: a, lengthFt: l, size, material, phase }) } as const;
      }
      const m = num(maxDrop);
      if (!Number.isFinite(m)) return { kind: "error", message: "Enter a maximum drop percent." } as const;
      return { kind: "find", data: sizeForVoltageDrop({ voltage: v, amps: a, lengthFt: l, material, phase, maxDropPercent: m }) } as const;
    } catch (e) {
      return { kind: "error", message: e instanceof CalcError ? e.message : "Could not calculate." } as const;
    }
  }, [mode, voltage, amps, lengthFt, phase, material, size, maxDrop]);

  return (
    <Screen>
      <Card>
        <Segmented<Mode> label="Mode" value={mode} onChange={setMode} options={[{ value: "check", label: "Check a size" }, { value: "find", label: "Find the size" }]} />
        <Segmented<Phase> label="System" value={phase} onChange={setPhase} options={[{ value: 1, label: "Single-phase" }, { value: 3, label: "Three-phase" }]} />
        <Segmented<Material> label="Conductor" value={material} onChange={(m) => { setMaterial(m); if (!sizesFor(m).includes(size)) setSize(sizesFor(m)[0]!); }} options={[{ value: "Cu", label: "Copper" }, { value: "Al", label: "Aluminum" }]} />
        <NumberField label="Voltage" unit="V" value={voltage} onChange={setVoltage} />
        <NumberField label="Load current" unit="A" value={amps} onChange={setAmps} />
        <NumberField label="One-way length" unit="ft" value={lengthFt} onChange={setLengthFt} />
        {mode === "check" ? (
          <SizePicker label="Size (AWG / kcmil)" sizes={sizes} value={size} onChange={setSize} />
        ) : (
          <NumberField label="Maximum drop" unit="%" value={maxDrop} onChange={setMaxDrop} />
        )}
      </Card>
      <Card>
        {result.kind === "error" && <ErrorText message={result.message} />}
        {result.kind === "check" && (
          <>
            <BigResult label="Voltage drop" value={`${fmt(result.data.dropVolts, 2)} V  (${fmt(result.data.dropPercent, 1)}%)`} tone={result.data.dropPercent > 3 ? "danger" : "ok"} />
            <ResultRow label="Voltage at load" value={`${fmt(result.data.voltageAtLoad, 1)} V`} />
            <References refs={result.data.refs} />
          </>
        )}
        {result.kind === "find" && (
          <>
            <BigResult label="Smallest size under target" value={`${result.data.size} ${material === "Cu" ? "AWG/kcmil Cu" : "AWG/kcmil Al"}`} />
            <ResultRow label="Drop at that size" value={`${fmt(result.data.dropVolts, 2)} V  (${fmt(result.data.dropPercent, 1)}%)`} />
            <ResultRow label="Voltage at load" value={`${fmt(result.data.voltageAtLoad, 1)} V`} />
            <References refs={result.data.refs} />
          </>
        )}
      </Card>
    </Screen>
  );
}
