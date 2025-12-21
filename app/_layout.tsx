import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme, Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Conditionally import GestureHandler for native platforms
let GestureHandlerRootView: React.ComponentType<{ style?: object; children: React.ReactNode }>;
if (Platform.OS !== "web") {
  GestureHandlerRootView = require("react-native-gesture-handler").GestureHandlerRootView;
} else {
  GestureHandlerRootView = ({ children, style }) => <View style={style}>{children}</View>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
