import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { entriesFor, searchEntries } from "@electricalos/nec-data";
import { Card, Label, Screen } from "@/components/ui";
import { useSettings } from "@/store/settings";
import { colors, radius, spacing } from "@/theme";

export default function ReferenceScreen() {
  const { settings } = useSettings();
  const [query, setQuery] = useState("");
  const results = useMemo(
    () => (query.trim() ? searchEntries(settings.edition, query, 20) : entriesFor(settings.edition)),
    [query, settings.edition],
  );
  return (
    <Screen>
      <TextInput
        style={styles.search}
        value={query}
        onChangeText={setQuery}
        placeholder={`Search NEC ${settings.edition} reference`}
        placeholderTextColor={colors.muted}
        autoCorrect={false}
      />
      {results.length === 0 && <Text style={styles.empty}>No entries match. Try a section number or a keyword like "derating".</Text>}
      {results.map((e) => (
        <Card key={e.id}>
          <Text style={styles.section}>{e.section}</Text>
          <Text style={styles.title}>{e.title}</Text>
          <Text style={styles.summary}>{e.summary}</Text>
          {e.fieldNotes && e.fieldNotes.length > 0 && (
            <View style={styles.notes}>
              <Label>Field notes</Label>
              {e.fieldNotes.map((n, i) => (
                <Text key={i} style={styles.note}>{`• ${n}`}</Text>
              ))}
            </View>
          )}
        </Card>
      ))}
      <Text style={styles.footer}>Summaries are our own words, not code text. Read the official section in NFPA Free Access before relying on it.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { backgroundColor: colors.card, color: colors.text, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: spacing.md, fontSize: 17 },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.lg },
  section: { color: colors.accent, fontWeight: "700" },
  title: { color: colors.text, fontSize: 17, fontWeight: "700" },
  summary: { color: colors.text, fontSize: 15, lineHeight: 21 },
  notes: { gap: spacing.xs },
  note: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  footer: { color: colors.muted, fontSize: 12, textAlign: "center", lineHeight: 16 },
});
