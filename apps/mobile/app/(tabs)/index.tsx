import { Link, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, Screen } from "@/components/ui";
import { colors, spacing } from "@/theme";

const CALCULATORS: { href: Href; title: string; blurb: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { href: "/calc/voltage-drop", title: "Voltage drop", blurb: "Drop in volts and percent, or the size that keeps you under 3%.", icon: "trending-down" },
  { href: "/calc/ampacity", title: "Conductor sizing", blurb: "Ampacity with ambient and bundling derating, termination limits, and the minimum size for a load.", icon: "resize" },
  { href: "/calc/conduit-fill", title: "Conduit fill", blurb: "Smallest EMT, RMC or PVC trade size for a set of conductors.", icon: "git-merge" },
];

export default function CalculatorsScreen() {
  return (
    <Screen>
      {CALCULATORS.map((c) => (
        <Link key={c.title} href={c.href} asChild>
          <Pressable>
            <Card style={styles.row}>
              <Ionicons name={c.icon} size={28} color={colors.accent} />
              <View style={styles.text}>
                <Text style={styles.title}>{c.title}</Text>
                <Text style={styles.blurb}>{c.blurb}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Card>
          </Pressable>
        </Link>
      ))}
      <Text style={styles.footer}>All calculators work offline.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  text: { flex: 1, gap: 2 },
  title: { color: colors.text, fontSize: 17, fontWeight: "700" },
  blurb: { color: colors.muted, fontSize: 14, lineHeight: 19 },
  footer: { color: colors.muted, textAlign: "center", marginTop: spacing.md },
});
