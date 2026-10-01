import { StyleSheet, Text } from "react-native";
import { Card, Screen } from "@/components/ui";
import { colors } from "@/theme";

/** Phase 3: wired to services/ask. Until then this is an honest placeholder. */
export default function AskScreen() {
  return (
    <Screen>
      <Card>
        <Text style={styles.title}>Ask a code question</Text>
        <Text style={styles.body}>
          Coming in a later build. Answers will cite article numbers, use the edition you pick in Settings, and need a
          connection. Calculators and Reference work offline today.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 18, fontWeight: "700" },
  body: { color: colors.muted, fontSize: 15, lineHeight: 21 },
});
