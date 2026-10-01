import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { JURISDICTIONS, JURISDICTIONS_AS_OF } from "@electricalos/nec-data";
import { Screen } from "@/components/ui";
import { useSettings } from "@/store/settings";
import { colors, radius, spacing } from "@/theme";

export default function JurisdictionScreen() {
  const router = useRouter();
  const { settings, setJurisdiction } = useSettings();
  const [query, setQuery] = useState("");
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? JURISDICTIONS.filter((j) => j.name.toLowerCase().includes(q) || j.code.toLowerCase() === q) : JURISDICTIONS;
  }, [query]);

  return (
    <Screen>
      <TextInput style={styles.search} value={query} onChangeText={setQuery} placeholder="Search states" placeholderTextColor={colors.muted} autoCorrect={false} autoFocus />
      {list.map((j) => {
        const active = j.code === settings.jurisdiction;
        return (
          <Pressable
            key={j.code}
            style={[styles.row, active && styles.rowActive]}
            onPress={() => {
              setJurisdiction(j.code, j.edition);
              router.back();
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <View style={styles.rowText}>
              <Text style={styles.name}>{j.name}</Text>
              <Text style={styles.meta}>
                NEC {j.edition}
                {j.statewide === false ? " (adopted locally, varies by city or county)" : ""}
              </Text>
            </View>
            {active && <Ionicons name="checkmark" size={22} color={colors.accent} />}
          </Pressable>
        );
      })}
      <Text style={styles.footer}>Adoption snapshot as of {JURISDICTIONS_AS_OF}. Local amendments are not reflected. You can override the edition in Settings.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { backgroundColor: colors.card, color: colors.text, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: spacing.md, fontSize: 17 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  rowActive: { borderColor: colors.accent },
  rowText: { flex: 1, gap: 2 },
  name: { color: colors.text, fontSize: 16, fontWeight: "600" },
  meta: { color: colors.muted, fontSize: 13 },
  footer: { color: colors.muted, fontSize: 12, textAlign: "center", lineHeight: 16 },
});
