import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ConductorSize } from "@electricalos/calc";
import { Label } from "@/components/ui";
import { colors, spacing } from "@/theme";

/** Horizontal chip strip for AWG/kcmil sizes; the list is long so it scrolls. */
export function SizePicker({ label, sizes, value, onChange }: { label: string; sizes: readonly ConductorSize[]; value: ConductorSize; onChange: (s: ConductorSize) => void }) {
  return (
    <View style={styles.wrap}>
      <Label>{label}</Label>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {sizes.map((s) => {
          const active = s === value;
          return (
            <Pressable key={s} onPress={() => onChange(s)} style={[styles.chip, active && styles.chipActive]} accessibilityRole="button" accessibilityState={{ selected: active }}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{s}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  row: { gap: spacing.sm, paddingVertical: 2 },
  chip: { minWidth: 48, alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.text, fontSize: 15 },
  chipTextActive: { color: colors.accentText, fontWeight: "700" },
});
