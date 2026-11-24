import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="explore" />
      <Stack.Screen name="notes" />
      <Stack.Screen name="study-tools" />
      <Stack.Screen name="study-tracker" />
    </Stack>
  );
}
