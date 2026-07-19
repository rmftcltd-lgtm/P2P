import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#f3f6f0" },
        headerTintColor: "#121712",
        contentStyle: { backgroundColor: "#f3f6f0" },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: "Relay" }} />
      <Stack.Screen name="customer" options={{ title: "Customer" }} />
      <Stack.Screen name="driver" options={{ title: "Driver" }} />
    </Stack>
  );
}
