import { Stack } from "expo-router";

export default function TefsirLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[surahId]" />
    </Stack>
  );
}
