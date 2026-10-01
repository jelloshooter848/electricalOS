import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  CONDUCTOR_SIZES,
  CalcError,
  minimumConduitSize,
  type ConductorGroup,
  type ConduitType,
  type Insulation,
} from "@electricalos/calc";
import { SizePicker } from "@/components/SizePicker";
import { BigResult, Card, ErrorText, NumberField, References, ResultRow, Screen, Segmented } from "@/components/ui";
import { fmt, num } from "@/num";
import { colors, spacing } from "@/theme";

interface GroupDraft { size: ConductorGroup["size"]; insulation: Insulation; count: string }

const INSULATIONS: { value: Insulation; label: string }[] = [
  { value: "THHN", label: "THHN" }, { value: "THWN", label: "THWN" }, { value: "THWN-2", label: "THWN-2" }, { value: "XHHW", label: "XHHW" }, { value: "XHHW-2", label: "XHHW-2" },
];

export default function ConduitFillScreen() {
  const [conduitType, setConduitType] = useState<ConduitType>("EMT");
  const [isNipple, setIsNipple] = useState(false);
  const [groups, setGroups] = useState<GroupDraft[]>([{ size: "12", insulation: "THHN", count: "3" }]);

  const update = (i: number, patch: Partial<GroupDraft>) => setGroups((g) => g.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const remove = (i: number) => setGroups((g) => g.filter((_, j) => j !== i));
  const add = () => setGroups((g) => [...g, { size: "12", insulation: "THHN", count: "1" }]);

  const result = useMemo(() => {
    const conductors: ConductorGroup[] = [];
    for (const g of groups) {
      const c = num(g.count);
      if (!Number.isFinite(c)) return { kind: "error", message: "Enter a count for every conductor row." } as const;
      conductors.push({ size: g.size, insulation: g.insulation, count: c });
    }
    try {
      return { kind: "fill", data: minimumConduitSize({ conductors, conduitType, isNipple }) } as const;
    } catch (e) {
      return { kind: "error", message: e instanceof CalcError ? e.message : "Could not calculate." } as const;
    }
  }, [groups, conduitType, isNipple]);

  return (
    <Screen>
      <Card>
        <Segmented<ConduitType> label="Raceway" value={conduitType} onChange={setConduitType} options={[{ value: "EMT", label: "EMT" }, { value: "RMC", label: "RMC" }, { value: "PVC40", label: "PVC Sch 40" }, { value: "PVC80", label: "PVC Sch 80" }]} />
        <Segmented<"run" | "nipple"> label="Length" value={isNipple ? "nipple" : "run"} onChange={(v) => setIsNipple(v === "nipple")} options={[{ value: "run", label: "Over 24 in" }, { value: "nipple", label: "Nipple, 24 in or less" }]} />
      </Card>
      {groups.map((g, i) => (
        <Card key={i}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupTitle}>Conductors {i + 1}</Text>
            {groups.length > 1 && (
              <Pressable onPress={() => remove(i)} accessibilityLabel="Remove row" hitSlop={8}>
                <Ionicons name="trash" size={20} color={colors.danger} />
              </Pressable>
            )}
          </View>
          <Segmented<Insulation> label="Insulation" value={g.insulation} onChange={(insulation) => update(i, { insulation })} options={INSULATIONS} />
          <SizePicker label="Size" sizes={CONDUCTOR_SIZES} value={g.size} onChange={(size) => update(i, { size })} />
          <NumberField label="Count" value={g.count} onChange={(count) => update(i, { count })} />
        </Card>
      ))}
      <Pressable onPress={add} style={styles.addBtn} accessibilityRole="button">
        <Ionicons name="add" size={20} color={colors.accentText} />
        <Text style={styles.addText}>Add conductors</Text>
      </Pressable>
      <Card>
        {result.kind === "error" && <ErrorText message={result.message} />}
        {result.kind === "fill" && (
          <>
            <BigResult label={`Minimum ${conduitType === "EMT" || conduitType === "RMC" ? conduitType : "PVC"} trade size`} value={`${result.data.tradeSize} in`} />
            <ResultRow label="Conductors" value={`${result.data.conductorCount}`} />
            <ResultRow label="Conductor area" value={`${fmt(result.data.totalConductorAreaIn2, 4)} sq in`} />
            <ResultRow label="Allowed area" value={`${fmt(result.data.allowedAreaIn2, 4)} sq in (${result.data.maxFillPercent}%)`} />
            <ResultRow label="Actual fill" value={`${fmt(result.data.fillPercent, 1)}%`} />
            <References refs={result.data.refs} />
          </>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  groupHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  groupTitle: { color: colors.text, fontWeight: "700", fontSize: 16 },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs, backgroundColor: colors.accent, borderRadius: 999, paddingVertical: spacing.md },
  addText: { color: colors.accentText, fontWeight: "700", fontSize: 16 },
});
