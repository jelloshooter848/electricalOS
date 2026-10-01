import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { findJurisdiction, type NecEdition } from "@electricalos/nec-data";
import { Card, Label, Screen, Segmented } from "@/components/ui";
import { useSettings } from "@/store/settings";
import { colors, spacing } from "@/theme";

export default function SettingsScreen() {
  const { settings, setEdition } = useSettings();
  const j = findJurisdiction(settings.jurisdiction);
  const overridden = j !== undefined && j.edition !== settings.edition;
  return (
    <Screen>
      <Card>
        <Label>Jurisdiction</Label>
        <Link href="/settings/jurisdiction" asChild>
          <Pressable style={styles.picker} accessibilityRole="button">
            <View style={styles.pickerText}>
              <Text style={styles.pickerValue}>{j ? j.name : "Choose a state"}</Text>
              <Text style={styles.hint}>{j ? `Adopted NEC ${j.edition}` : "Sets the edition automatically"}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>
        </Link>
      </Card>
      <Card>
        <Segmented<NecEdition>
          label="NEC edition"
          value={settings.edition}
          onChange={setEdition}
          options={[
            { value: 2020, label: "2020" },
            { value: 2023, label: "2023" },
            { value: 2026, label: "2026" },
          ]}
        />
        <Text style={styles.hint}>
          {overridden
            ? `Overriding ${j?.name}'s adopted edition (${j?.edition}). Local amendments may apply.`
            : "Reference content for 2020 and 2026 is still being written; 2023 entries are shown in the meantime."}
        </Text>
      </Card>
      <Card>
        <Text style={styles.title}>About</Text>
        <Text style={styles.hint}>
          electricalOS 0.1.0. Calculators and reference work offline. Nothing here is a substitute for the adopted code or
          your authority having jurisdiction.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  picker: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  pickerText: { flex: 1, gap: 2 },
  pickerValue: { color: colors.text, fontSize: 17, fontWeight: "600" },
  title: { color: colors.text, fontSize: 17, fontWeight: "700" },
  hint: { color: colors.muted, fontSize: 14, lineHeight: 20 },
});
