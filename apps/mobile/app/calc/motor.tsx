import { useMemo, useState } from "react";
import {
  CalcError,
  MOTOR_OCPD_LABEL,
  SINGLE_PHASE_HP,
  THREE_PHASE_HP,
  motorBranchCircuit,
  type MotorOcpdDevice,
  type MotorSpec,
  type Phase,
  type SinglePhaseHp,
  type SinglePhaseVolts,
  type ThreePhaseHp,
  type ThreePhaseVolts,
} from "@electricalos/calc";
import { BigResult, Card, ErrorText, References, ResultRow, Screen, Segmented } from "@/components/ui";
import { fmt } from "@/num";

const DEVICES = (Object.keys(MOTOR_OCPD_LABEL) as MotorOcpdDevice[]).map((d) => ({ value: d, label: MOTOR_OCPD_LABEL[d] }));
const V1: SinglePhaseVolts[] = [115, 200, 208, 230];
const V3: ThreePhaseVolts[] = [200, 208, 230, 460, 575];

export default function MotorScreen() {
  const [phase, setPhase] = useState<Phase>(3);
  const [hp1, setHp1] = useState<SinglePhaseHp>("5");
  const [v1, setV1] = useState<SinglePhaseVolts>(230);
  const [hp3, setHp3] = useState<ThreePhaseHp>("10");
  const [v3, setV3] = useState<ThreePhaseVolts>(460);
  const [device, setDevice] = useState<MotorOcpdDevice>("inverse-time-breaker");

  const result = useMemo(() => {
    const motor: MotorSpec = phase === 1 ? { phase: 1, hp: hp1, volts: v1 } : { phase: 3, hp: hp3, volts: v3 };
    try {
      return { kind: "ok", data: motorBranchCircuit({ motor, device }) } as const;
    } catch (e) {
      return { kind: "error", message: e instanceof CalcError ? e.message : "Could not calculate." } as const;
    }
  }, [phase, hp1, v1, hp3, v3, device]);

  return (
    <Screen>
      <Card>
        <Segmented<Phase> label="Motor" value={phase} onChange={setPhase} options={[{ value: 1, label: "Single-phase" }, { value: 3, label: "Three-phase" }]} />
        {phase === 1 ? (
          <>
            <Segmented<SinglePhaseHp> label="Horsepower" value={hp1} onChange={setHp1} options={SINGLE_PHASE_HP.map((h) => ({ value: h, label: h }))} />
            <Segmented<SinglePhaseVolts> label="Voltage" value={v1} onChange={setV1} options={V1.map((v) => ({ value: v, label: `${v} V` }))} />
          </>
        ) : (
          <>
            <Segmented<ThreePhaseHp> label="Horsepower" value={hp3} onChange={setHp3} options={THREE_PHASE_HP.map((h) => ({ value: h, label: h }))} />
            <Segmented<ThreePhaseVolts> label="Voltage" value={v3} onChange={setV3} options={V3.map((v) => ({ value: v, label: `${v} V` }))} />
          </>
        )}
        <Segmented<MotorOcpdDevice> label="Short-circuit protection" value={device} onChange={setDevice} options={DEVICES} />
      </Card>
      <Card>
        {result.kind === "error" && <ErrorText message={result.message} />}
        {result.kind === "ok" && (
          <>
            <BigResult label="Maximum breaker or fuse" value={`${result.data.maxOcpdStandard} A`} />
            <ResultRow label="Table full-load current" value={`${fmt(result.data.flc, 1)} A`} />
            <ResultRow label="Minimum conductor ampacity (125%)" value={`${fmt(result.data.conductorAmps, 1)} A`} />
            <ResultRow label="Calculated OCPD limit" value={`${fmt(result.data.maxOcpdCalculated, 1)} A`} />
            <References refs={result.data.refs} />
          </>
        )}
      </Card>
    </Screen>
  );
}
