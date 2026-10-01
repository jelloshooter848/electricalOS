import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SettingsProvider } from "@/store/settings";
import { colors } from "@/theme";

export default function RootLayout() {
  return (
    <SettingsProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="calc/voltage-drop" options={{ title: "Voltage drop" }} />
        <Stack.Screen name="calc/ampacity" options={{ title: "Conductor sizing" }} />
        <Stack.Screen name="calc/conduit-fill" options={{ title: "Conduit fill" }} />
        <Stack.Screen name="calc/box-fill" options={{ title: "Box fill" }} />
        <Stack.Screen name="calc/motor" options={{ title: "Motor circuit" }} />
        <Stack.Screen name="calc/dwelling-load" options={{ title: "Dwelling load" }} />
        <Stack.Screen name="calc/grounding" options={{ title: "Grounding conductors" }} />
        <Stack.Screen name="calc/transformer" options={{ title: "Transformer" }} />
        <Stack.Screen name="calc/power" options={{ title: "Power and current" }} />
        <Stack.Screen name="reference/[id]" options={{ title: "Reference" }} />
        <Stack.Screen name="settings/jurisdiction" options={{ title: "Jurisdiction", presentation: "modal" }} />
      </Stack>
    </SettingsProvider>
  );
}
