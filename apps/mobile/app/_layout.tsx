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
      </Stack>
    </SettingsProvider>
  );
}
