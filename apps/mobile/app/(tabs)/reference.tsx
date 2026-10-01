import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { entriesFor, searchEntries, type ReferenceEntry } from "@electricalos/nec-data";
import { Card, Screen } from "@/components/ui";
import { useSettings } from "@/store/settings";
import { colors, radius, spacing } from "@/theme";

/** Article prefix for grouping and chips: "210.52(A)" -> "210", "Chapter 9, Table 4" -> "Ch 9". */
function articleOf(section: string): string {
  if (/^chapter\s*9/i.test(section)) return "Ch 9";
  const m = /^(\d+)/.exec(section);
  return m?.[1] ?? "Other";
}

/** Sort key so 110.26 sorts before 210.8 and 210.8 before 210.52. */
function sortKey(section: string): number[] {
  if (/^chapter\s*9/i.test(section)) return [9000, ...(section.match(/\d+/g)?.slice(1).map(Number) ?? [])];
  return (section.match(/\d+/g) ?? []).map(Number);
}
function compareSections(a: ReferenceEntry, b: ReferenceEntry): number {
  const ka = sortKey(a.section), kb = sortKey(b.section);
  for (let i = 0; i < Math.max(ka.length, kb.length); i++) {
    const d = (ka[i] ?? 0) - (kb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

export default function ReferenceScreen() {
  const { settings } = useSettings();
  const [query, setQuery] = useState("");
  const [article, setArticle] = useState<string | null>(null);

  // Only 2023 content exists so far; fall back to it for other editions with a banner.
  const edition = entriesFor(settings.edition).length > 0 ? settings.edition : 2023;
  const fallback = edition !== settings.edition;
  const all = useMemo(() => [...entriesFor(edition)].sort(compareSections), [edition]);
  const articles = useMemo(() => Array.from(new Set(all.map((e) => articleOf(e.section)))), [all]);

  const results = useMemo(() => {
    const base = query.trim() ? searchEntries(edition, query, 50) : all;
    return article ? base.filter((e) => articleOf(e.section) === article) : base;
  }, [query, article, edition, all]);

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
      <View style={styles.chips}>
        <Chip label="All" active={article === null} onPress={() => setArticle(null)} />
        {articles.map((a) => (
          <Chip key={a} label={a} active={article === a} onPress={() => setArticle(article === a ? null : a)} />
        ))}
      </View>
      {fallback && <Text style={styles.banner}>Showing NEC 2023 entries; {settings.edition} content is not written yet.</Text>}
      {results.length === 0 && <Text style={styles.empty}>No entries match. Try a section number or a keyword like "derating".</Text>}
      {results.map((e) => (
        <Link key={e.id} href={{ pathname: "/reference/[id]", params: { id: e.id } }} asChild>
          <Pressable>
            <Card style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.section}>{e.section}</Text>
                <Text style={styles.title}>{e.title}</Text>
                <Text style={styles.summary} numberOfLines={2}>{e.summary}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Card>
          </Pressable>
        </Link>
      ))}
      <Text style={styles.footer}>Summaries are our own words, not code text. Read the official section in NFPA Free Access before relying on it.</Text>
    </Screen>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]} accessibilityRole="button" accessibilityState={{ selected: active }}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  search: { backgroundColor: colors.card, color: colors.text, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: spacing.md, fontSize: 17 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.text, fontSize: 14 },
  chipTextActive: { color: colors.accentText, fontWeight: "700" },
  banner: { color: colors.accentText, backgroundColor: colors.accent, borderRadius: 8, padding: spacing.sm, fontSize: 13, fontWeight: "600" },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.lg },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  rowText: { flex: 1, gap: 2 },
  section: { color: colors.accent, fontWeight: "700" },
  title: { color: colors.text, fontSize: 16, fontWeight: "700" },
  summary: { color: colors.muted, fontSize: 14, lineHeight: 19 },
  footer: { color: colors.muted, fontSize: 12, textAlign: "center", lineHeight: 16 },
});
