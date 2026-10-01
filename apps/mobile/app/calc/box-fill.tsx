import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BOX_FILL_SIZES, COMMON_BOXES, CalcError, boxFill, type BoxFillSize } from "@electricalos/calc";
import { BigResult, Card, ErrorText, Label, NumberField, References, ResultRow, Screen, Segmented } from "@/components/ui";
import { fmt, num } from "@/num";
import { colors, spacing } from "@/theme";

interface Row { size: BoxFillSize; count: string }
const SIZE_OPTIONS = BOX_FILL_SIZES.map((s) => ({ value: s, label: s }));

export default function BoxFillScreen() {
  const [rows, setRows] = useState<Row[]>([{ size: "12", count: "4" }]);
  const [egcs, setEgcs] = useState("2");
  const [clamps, setClamps] = useState(true);
  const [fittings, setFittings] = useState("0");
  const [yokes, setYokes] = useState("1");
  const [boxVolume, setBoxVolume] = useState("18");

  const update = (i: number, patch: Partial<Row>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  const result = useMemo(() => {
    const conductors = [];
    for (const r of rows) {
      const c = num(r.count);
      if (!Number.isFinite(c)) return { kind: "error", message: "Enter a count for every conductor row." } as const;
      conductors.push({ size: r.size, count: c });
    }
    const e = num(egcs), f = num(fittings), y = num(yokes);
    if (![e, f, y].every(Number.isFinite)) return { kind: "error", message: "Enter whole numbers for grounds, fittings and devices." } as const;
    const bv = boxVolume.trim() === "" ? undefined : num(boxVolume);
    try {
      const input = { conductors, equipmentGroundingConductors: e, internalClamps: clamps, supportFittings: f, deviceYokes: y };
      return { kind: "ok", data: boxFill(bv === undefined ? input : { ...input, boxVolumeIn3: bv }) } as const;
    } catch (err) {
      return { kind: "error", message: err instanceof CalcError ? err.message : "Could not calculate." } as const;
    }
  }, [rows, egcs, clamps, fittings, yokes, boxVolume]);

  return (
    <Screen>
      {rows.map((r, i) => (
        <Card key={i}>
          <View style={styles.header}>
            <Text style={styles.title}>Conductors {i + 1}</Text>
            {rows.length > 1 && (
              <Pressable onPress={() => setRows((x) => x.filter((_, j) => j !== i))} hitSlop={8} accessibilityLabel="Remove row">
                <Ionicons name="trash" size={20} color={colors.danger} />
              </Pressable>
            )}
          </View>
          <Segmented<BoxFillSize> label="Size (AWG)" value={r.size} onChange={(size) => update(i, { size })} options={SIZE_OPTIONS} />
          <NumberField label="Conductors entering the box (not pigtails)" value={r.count} onChange={(count) => update(i, { count })} />
        </Card>
      ))}
      <Pressable onPress={() => setRows((x) => [...x, { size: "14", count: "2" }])} style={styles.addBtn} accessibilityRole="button">
        <Ionicons name="add" size={20} color={colors.accentText} />
        <Text style={styles.addText}>Add a conductor size</Text>
      </Pressable>
      <Card>
        <NumberField label="Equipment grounding conductors" value={egcs} onChange={setEgcs} />
        <Segmented<"yes" | "no"> label="Internal cable clamps" value={clamps ? "yes" : "no"} onChange={(v) => setClamps(v === "yes")} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
        <NumberField label="Studs or hickeys" value={fittings} onChange={setFittings} />
        <NumberField label="Device yokes (switches, receptacles)" value={yokes} onChange={setYokes} />
        <NumberField label="Box volume to check (blank to skip)" unit="cu in" value={boxVolume} onChange={setBoxVolume} />
        <Label>Common boxes</Label>
        <View style={styles.boxes}>
          {COMMON_BOXES.map((b) => (
            <Pressable key={b.label} onPress={() => setBoxVolume(String(b.volumeIn3))} style={styles.boxChip} accessibilityRole="button">
              <Text style={styles.boxChipText}>{b.label}</Text>
              <Text style={styles.boxChipVol}>{b.volumeIn3} cu in</Text>
            </Pressable>
          ))}
        </View>
      </Card>
      <Card>
        {result.kind === "error" && <ErrorText message={result.message} />}
        {result.kind === "ok" && (
          <>
            <BigResult label="Minimum box volume" value={`${fmt(result.data.requiredVolumeIn3, 2)} cu in`} tone={result.data.compliant === false ? "danger" : "ok"} />
            {result.data.compliant !== undefined && <ResultRow label={`${result.data.boxVolumeIn3} cu in box`} value={result.data.compliant ? "OK" : "Too small"} />}
            {result.data.lines.map((l) => (
              <ResultRow key={l.label} label={`${l.label} (${l.allowances} x ${l.size} AWG)`} value={`${fmt(l.volumeIn3, 2)} cu in`} />
            ))}
            <References refs={result.data.refs} />
          </>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: colors.text, fontWeight: "700", fontSize: 16 },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs, backgroundColor: colors.accent, borderRadius: 999, paddingVertical: spacing.md },
  addText: { color: colors.accentText, fontWeight: "700", fontSize: 16 },
  boxes: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  boxChip: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, backgroundColor: colors.bg },
  boxChipText: { color: colors.text, fontSize: 13 },
  boxChipVol: { color: colors.muted, fontSize: 12 },
});
