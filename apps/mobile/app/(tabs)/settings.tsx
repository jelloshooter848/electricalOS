import { StyleSheet, Text } from "react-native";
import type { NecEdition } from "@electricalos/nec-data";
import { Card, Screen, Segmented } from "@/components/ui";
import { useSettings } from "@/store/settings";
import { colors } from "@/theme";

export default function SettingsScreen() {
  const { settings, setEdition } = useSettings();
  return (
    <Screen>
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
          Pick the edition your jurisdiction has adopted. Most states are on 2023; several moved to 2026 in 2026. Reference
          content for 2020 and 2026 is still being written.
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
  title: { color: colors.text, fontSize: 17, fontWeight: "700" },
  hint: { color: colors.muted, fontSize: 14, lineHeight: 20 },
});
