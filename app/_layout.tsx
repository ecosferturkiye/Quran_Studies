import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme, Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";

// Conditionally import GestureHandler for native platforms
let GestureHandlerRootView: React.ComponentType<{ style?: object; children: React.ReactNode }>;
if (Platform.OS !== "web") {
  GestureHandlerRootView = require("react-native-gesture-handler").GestureHandlerRootView;
} else {
  GestureHandlerRootView = ({ children, style }) => <View style={style}>{children}</View>;
}

// Scrollbar CSS for web/Electron
const scrollbarCSS = `
  /* Webkit browsers (Chrome, Safari, Edge, Electron) */
  ::-webkit-scrollbar {
    width: 12px;
    height: 12px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 6px;
  }
  ::-webkit-scrollbar-thumb {
    background: #4CAF50;
    border-radius: 6px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #388E3C;
    border: 2px solid transparent;
    background-clip: padding-box;
  }
  /* Dark mode scrollbar */
  @media (prefers-color-scheme: dark) {
    ::-webkit-scrollbar-thumb {
      background: #66BB6A;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #81C784;
    }
  }
  /* Firefox */
  * {
    scrollbar-width: auto;
    scrollbar-color: #4CAF50 transparent;
  }
`;

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Inject scrollbar CSS on web/Electron
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'custom-scrollbar-style';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = scrollbarCSS;
        document.head.appendChild(style);
      }
    }
  }, []);

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
