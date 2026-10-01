import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CalcError, dwellingLoadOptional } from "@electricalos/calc";
import { BigResult, Card, ErrorText, Label, NumberField, References, ResultRow, Screen } from "@/components/ui";
import { fmt, num } from "@/num";
import { colors, radius, spacing } from "@/theme";

interface Appliance { label: string; va: string }
const DEFAULT_APPLIANCES: Appliance[] = [
  { label: "Range", va: "12000" },
  { label: "Dryer", va: "5000" },
  { label: "Water heater", va: "4500" },
  { label: "Dishwasher", va: "1200" },
  { label: "Disposal", va: "900" },
];

function positive(s: string): number | undefined {
  const n = num(s);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export default function DwellingLoadScreen() {
  const [area, setArea] = useState("2000");
  const [sac, setSac] = useState("2");
  const [laundry, setLaundry] = useState("1");
  const [appliances, setAppliances] = useState<Appliance[]>(DEFAULT_APPLIANCES);
  const [acVa, setAcVa] = useState("5000");
  const [heatVa, setHeatVa] = useState("10000");
  const [heatUnits, setHeatUnits] = useState("1");
  const [hpSupp, setHpSupp] = useState("0");

  const update = (i: number, patch: Partial<Appliance>) => setAppliances((a) => a.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  const result = useMemo(() => {
    const a = num(area), s = num(sac), l = num(laundry);
    if (![a, s, l].every(Number.isFinite)) return { kind: "error", message: "Enter floor area and circuit counts." } as const;
    const list = [];
    for (const ap of appliances) {
      const v = num(ap.va);
      if (!Number.isFinite(v)) return { kind: "error", message: `Enter VA for ${ap.label || "each appliance"}.` } as const;
      list.push({ label: ap.label, va: v });
    }
    const heatingCooling: Parameters<typeof dwellingLoadOptional>[0]["heatingCooling"] = {};
    const ac = positive(acVa), heat = positive(heatVa), units = positive(heatUnits), supp = positive(hpSupp);
    if (ac !== undefined) heatingCooling.acVa = ac;
    if (heat !== undefined) heatingCooling.electricHeatVa = heat;
    if (units !== undefined) heatingCooling.electricHeatUnits = units;
    if (supp !== undefined) heatingCooling.heatPumpSupplementalVa = supp;
    try {
      return { kind: "ok", data: dwellingLoadOptional({ floorAreaSqFt: a, smallApplianceCircuits: s, laundryCircuits: l, appliances: list, heatingCooling }) } as const;
    } catch (e) {
      return { kind: "error", message: e instanceof CalcError ? e.message : "Could not calculate." } as const;
    }
  }, [area, sac, laundry, appliances, acVa, heatVa, heatUnits, hpSupp]);

  return (
    <Screen>
      <Card>
        <NumberField label="Floor area" unit="sq ft" value={area} onChange={setArea} />
        <NumberField label="Small-appliance circuits (min 2)" value={sac} onChange={setSac} />
        <NumberField label="Laundry circuits" value={laundry} onChange={setLaundry} />
      </Card>
      <Card>
        <Label>Appliances (nameplate VA)</Label>
        {appliances.map((ap, i) => (
          <View key={i} style={styles.appRow}>
            <TextInput style={[styles.input, styles.appName]} value={ap.label} onChangeText={(label) => update(i, { label })} placeholder="Appliance" placeholderTextColor={colors.muted} />
            <TextInput style={[styles.input, styles.appVa]} value={ap.va} onChangeText={(va) => update(i, { va })} keyboardType="decimal-pad" placeholder="VA" placeholderTextColor={colors.muted} />
            <Pressable onPress={() => setAppliances((a) => a.filter((_, j) => j !== i))} hitSlop={8} accessibilityLabel="Remove appliance">
              <Ionicons name="trash" size={20} color={colors.danger} />
            </Pressable>
          </View>
        ))}
        <Pressable onPress={() => setAppliances((a) => [...a, { label: "", va: "" }])} style={styles.addBtn} accessibilityRole="button">
          <Ionicons name="add" size={20} color={colors.accentText} />
          <Text style={styles.addText}>Add appliance</Text>
        </Pressable>
      </Card>
      <Card>
        <Label>Heating and cooling (largest one counts)</Label>
        <NumberField label="Air conditioning or heat pump compressor" unit="VA" value={acVa} onChange={setAcVa} />
        <NumberField label="Heat pump supplemental heat" unit="VA" value={hpSupp} onChange={setHpSupp} />
        <NumberField label="Electric space heating" unit="VA" value={heatVa} onChange={setHeatVa} />
        <NumberField label="Separately controlled heating units" value={heatUnits} onChange={setHeatUnits} />
      </Card>
      <Card>
        {result.kind === "error" && <ErrorText message={result.message} />}
        {result.kind === "ok" && (
          <>
            <BigResult label="Recommended service" value={`${result.data.recommendedServiceAmps} A`} />
            <ResultRow label="Calculated load" value={`${fmt(result.data.totalVa, 0)} VA, ${fmt(result.data.amps, 1)} A at 240 V`} />
            {result.data.lines.map((l, i) => (
              <ResultRow key={`${i}-${l.label}`} label={l.label} value={`${fmt(l.va, 0)} VA`} />
            ))}
            <References refs={result.data.refs} />
          </>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  appRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  input: { backgroundColor: colors.bg, color: colors.text, borderRadius: radius - 4, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 16 },
  appName: { flex: 2 },
  appVa: { flex: 1 },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs, backgroundColor: colors.accent, borderRadius: 999, paddingVertical: spacing.md },
  addText: { color: colors.accentText, fontWeight: "700", fontSize: 16 },
});
