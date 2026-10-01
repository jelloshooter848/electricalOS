import { Link, Stack, useLocalSearchParams, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { findEntry } from "@electricalos/nec-data";
import { Card, Label, Screen } from "@/components/ui";
import { useSettings } from "@/store/settings";
import { colors, spacing } from "@/theme";

const CALC_ROUTES: Record<string, { href: Href; title: string }> = {
  "voltage-drop": { href: "/calc/voltage-drop", title: "Voltage drop" },
  ampacity: { href: "/calc/ampacity", title: "Conductor sizing" },
  "conduit-fill": { href: "/calc/conduit-fill", title: "Conduit fill" },
  "box-fill": { href: "/calc/box-fill", title: "Box fill" },
  motor: { href: "/calc/motor", title: "Motor circuit" },
  "dwelling-load": { href: "/calc/dwelling-load", title: "Dwelling load" },
  grounding: { href: "/calc/grounding", title: "Grounding conductors" },
  transformer: { href: "/calc/transformer", title: "Transformer" },
  power: { href: "/calc/power", title: "Power and current" },
};

export default function ReferenceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { settings } = useSettings();
  // Only 2023 content exists so far; other editions fall back to it with a banner.
  const entry = id ? (findEntry(settings.edition, id) ?? findEntry(2023, id)) : undefined;
  const fallback = entry !== undefined && entry.edition !== settings.edition;

  if (!entry) {
    return (
      <Screen>
        <Card>
          <Text style={styles.summary}>That entry does not exist.</Text>
        </Card>
      </Screen>
    );
  }
  return (
    <Screen>
      <Stack.Screen options={{ title: entry.section }} />
      {fallback && <Text style={styles.banner}>Showing the NEC 2023 entry; {settings.edition} content is not written yet.</Text>}
      <Card>
        <Text style={styles.section}>{entry.section}{entry.priorSection ? `  (was ${entry.priorSection} in 2020)` : ""}</Text>
        <Text style={styles.title}>{entry.title}</Text>
        <Text style={styles.summary}>{entry.summary}</Text>
      </Card>
      {entry.fieldNotes && entry.fieldNotes.length > 0 && (
        <Card>
          <Label>Field notes</Label>
          {entry.fieldNotes.map((n, i) => (
            <Text key={i} style={styles.note}>{`• ${n}`}</Text>
          ))}
        </Card>
      )}
      {entry.calculators && entry.calculators.length > 0 && (
        <Card>
          <Label>Calculators</Label>
          {entry.calculators.map((c) => {
            const r = CALC_ROUTES[c];
            if (!r) return null;
            return (
              <Link key={c} href={r.href} asChild>
                <Pressable style={styles.linkRow} accessibilityRole="button">
                  <Ionicons name="calculator" size={18} color={colors.accent} />
                  <Text style={styles.linkText}>{r.title}</Text>
                </Pressable>
              </Link>
            );
          })}
        </Card>
      )}
      {entry.related && entry.related.length > 0 && (
        <Card>
          <Label>Related</Label>
          {entry.related.map((rid) => {
            const rel = findEntry(entry.edition, rid);
            if (!rel) return null;
            return (
              <Link key={rid} href={{ pathname: "/reference/[id]", params: { id: rid } }} asChild>
                <Pressable style={styles.linkRow} accessibilityRole="button">
                  <View style={styles.linkBody}>
                    <Text style={styles.relSection}>{rel.section}</Text>
                    <Text style={styles.relTitle}>{rel.title}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </Pressable>
              </Link>
            );
          })}
        </Card>
      )}
      <Text style={styles.footer}>Our own explanation, not code text. Read the official section in NFPA Free Access before relying on it.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: { color: colors.accentText, backgroundColor: colors.accent, borderRadius: 8, padding: spacing.sm, fontSize: 13, fontWeight: "600" },
  section: { color: colors.accent, fontWeight: "700" },
  title: { color: colors.text, fontSize: 20, fontWeight: "700" },
  summary: { color: colors.text, fontSize: 16, lineHeight: 23 },
  note: { color: colors.text, fontSize: 15, lineHeight: 21 },
  linkRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xs },
  linkText: { flex: 1, color: colors.text, fontSize: 16 },
  linkBody: { flex: 1 },
  relSection: { color: colors.accent, fontWeight: "600", fontSize: 14 },
  relTitle: { color: colors.text, fontSize: 15 },
  footer: { color: colors.muted, fontSize: 12, textAlign: "center", lineHeight: 16 },
});
