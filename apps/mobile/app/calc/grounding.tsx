import { useMemo, useState } from "react";
import {
  CalcError,
  equipmentGroundingConductor,
  groundingElectrodeConductor,
  sizesFor,
  type ConductorSize,
  type ElectrodeType,
  type Material,
} from "@electricalos/calc";
import { SizePicker } from "@/components/SizePicker";
import { BigResult, Card, ErrorText, NumberField, References, ResultRow, Screen, Segmented } from "@/components/ui";
import { num } from "@/num";

type Mode = "gec" | "egc";
const MATERIALS = [{ value: "Cu" as const, label: "Copper" }, { value: "Al" as const, label: "Aluminum" }];

export default function GroundingScreen() {
  const [mode, setMode] = useState<Mode>("gec");
  const [serviceMaterial, setServiceMaterial] = useState<Material>("Cu");
  const [serviceSize, setServiceSize] = useState<ConductorSize>("2/0");
  const [sets, setSets] = useState("1");
  const [gecMaterial, setGecMaterial] = useState<Material>("Cu");
  const [electrode, setElectrode] = useState<ElectrodeType>("other");
  const [ringSize, setRingSize] = useState<ConductorSize>("2");
  const [ocpd, setOcpd] = useState("100");
  const [egcMaterial, setEgcMaterial] = useState<Material>("Cu");

  const result = useMemo(() => {
    try {
      if (mode === "gec") {
        const s = num(sets);
        if (!Number.isFinite(s)) return { kind: "error", message: "Enter the number of parallel sets." } as const;
        return {
          kind: "gec",
          data: groundingElectrodeConductor({ serviceConductorSize: serviceSize, serviceConductorMaterial: serviceMaterial, parallelSets: s, gecMaterial, electrode, groundRingSize: ringSize }),
        } as const;
      }
      const a = num(ocpd);
      if (!Number.isFinite(a)) return { kind: "error", message: "Enter the overcurrent device rating." } as const;
      return { kind: "egc", data: equipmentGroundingConductor({ ocpdAmps: a, material: egcMaterial }) } as const;
    } catch (e) {
      return { kind: "error", message: e instanceof CalcError ? e.message : "Could not calculate." } as const;
    }
  }, [mode, serviceMaterial, serviceSize, sets, gecMaterial, electrode, ringSize, ocpd, egcMaterial]);

  return (
    <Screen>
      <Card>
        <Segmented<Mode> label="Conductor" value={mode} onChange={setMode} options={[{ value: "gec", label: "Grounding electrode (service)" }, { value: "egc", label: "Equipment ground (circuit)" }]} />
        {mode === "gec" ? (
          <>
            <Segmented<Material> label="Service conductor material" value={serviceMaterial} onChange={(m) => { setServiceMaterial(m); if (!sizesFor(m).includes(serviceSize)) setServiceSize(sizesFor(m)[0]!); }} options={MATERIALS} />
            <SizePicker label="Largest service conductor" sizes={sizesFor(serviceMaterial)} value={serviceSize} onChange={setServiceSize} />
            <NumberField label="Parallel sets per phase" value={sets} onChange={setSets} />
            <Segmented<Material> label="GEC material" value={gecMaterial} onChange={setGecMaterial} options={MATERIALS} />
            <Segmented<ElectrodeType> label="Connects only to" value={electrode} onChange={setElectrode} options={[{ value: "other", label: "Electrode system" }, { value: "rod-pipe-plate", label: "Rod, pipe or plate" }, { value: "concrete-encased", label: "Concrete-encased" }, { value: "ground-ring", label: "Ground ring" }]} />
            {electrode === "ground-ring" && <SizePicker label="Ground ring conductor" sizes={sizesFor("Cu")} value={ringSize} onChange={setRingSize} />}
          </>
        ) : (
          <>
            <NumberField label="Overcurrent device rating" unit="A" value={ocpd} onChange={setOcpd} />
            <Segmented<Material> label="EGC material" value={egcMaterial} onChange={setEgcMaterial} options={MATERIALS} />
          </>
        )}
      </Card>
      <Card>
        {result.kind === "error" && <ErrorText message={result.message} />}
        {result.kind === "gec" && (
          <>
            <BigResult label="Grounding electrode conductor" value={`${result.data.size} ${gecMaterial}`} />
            {result.data.size !== result.data.tableSize && <ResultRow label="Table 250.66 size before electrode cap" value={`${result.data.tableSize} ${gecMaterial}`} />}
            <ResultRow label="Service conductor area used" value={`${result.data.equivalentCmil.toLocaleString()} cmil`} />
            <References refs={result.data.refs} />
          </>
        )}
        {result.kind === "egc" && (
          <>
            <BigResult label="Equipment grounding conductor" value={`${result.data.size} ${egcMaterial}`} />
            <ResultRow label="Overcurrent device" value={`${result.data.ocpdAmps} A`} />
            <References refs={result.data.refs} />
          </>
        )}
      </Card>
    </Screen>
  );
}
