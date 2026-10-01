import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ViewProps } from "react-native";
import type { NecRef } from "@electricalos/calc";
import { colors, radius, spacing } from "@/theme";

export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

export function Card({ style, ...rest }: ViewProps) {
  return <View style={[styles.card, style]} {...rest} />;
}

export function Label({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function NumberField({
  label,
  value,
  onChange,
  unit,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
}) {
  return (
    <View style={styles.field}>
      <Label>{unit ? `${label} (${unit})` : label}</Label>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={colors.muted}
      />
    </View>
  );
}

export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.field}>
      <Label>{label}</Label>
      <View style={styles.segmentRow}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={String(o.value)}
              onPress={() => onChange(o.value)}
              style={[styles.segment, active && styles.segmentActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.resultRow}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={styles.resultValue}>{value}</Text>
    </View>
  );
}

export function BigResult({ label, value, tone = "ok" }: { label: string; value: string; tone?: "ok" | "danger" }) {
  return (
    <View style={styles.bigResult}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={[styles.bigValue, tone === "danger" && { color: colors.danger }]}>{value}</Text>
    </View>
  );
}

export function ErrorText({ message }: { message: string }) {
  return <Text style={styles.error}>{message}</Text>;
}

export function References({ refs }: { refs: NecRef[] }) {
  if (refs.length === 0) return null;
  return (
    <View style={styles.refs}>
      <Label>Code references</Label>
      {refs.map((r, i) => (
        <View key={`${r.section}-${i}`} style={styles.refRow}>
          <Text style={styles.refSection}>{r.section}</Text>
          <Text style={styles.refNote}>{r.note}</Text>
        </View>
      ))}
      <Text style={styles.disclaimer}>
        Explanations are in our own words. Verify against the edition adopted in your jurisdiction and your AHJ.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl * 2 },
  card: { backgroundColor: colors.card, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.md },
  label: { color: colors.muted, fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  field: { gap: spacing.xs },
  input: { backgroundColor: colors.bg, color: colors.text, borderRadius: radius - 4, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 18 },
  segmentRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  segment: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg },
  segmentActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  segmentText: { color: colors.text, fontSize: 15 },
  segmentTextActive: { color: colors.accentText, fontWeight: "700" },
  resultRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  resultLabel: { color: colors.muted, fontSize: 15 },
  resultValue: { color: colors.text, fontSize: 15, fontWeight: "600" },
  bigResult: { gap: spacing.xs },
  bigValue: { color: colors.ok, fontSize: 34, fontWeight: "800" },
  error: { color: colors.danger, fontSize: 15 },
  refs: { gap: spacing.sm, marginTop: spacing.sm },
  refRow: { gap: 2 },
  refSection: { color: colors.accent, fontWeight: "700" },
  refNote: { color: colors.text, fontSize: 14, lineHeight: 20 },
  disclaimer: { color: colors.muted, fontSize: 12, marginTop: spacing.sm, lineHeight: 16 },
});
