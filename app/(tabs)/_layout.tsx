import { Tabs } from "expo-router";
import { useColorScheme, Text } from "react-native";
import { colors } from "../../src/theme";

// Simple text-based icons for web compatibility
function QuranIcon({ color }: { color: string }) {
  return <Text style={{ fontSize: 20, color }}>📖</Text>;
}

function TefsirIcon({ color }: { color: string }) {
  return <Text style={{ fontSize: 20, color }}>📜</Text>;
}

function LearnIcon({ color }: { color: string }) {
  return <Text style={{ fontSize: 20, color }}>🎓</Text>;
}

function SettingsIcon({ color }: { color: string }) {
  return <Text style={{ fontSize: 20, color }}>⚙️</Text>;
}

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const theme = isDark
    ? {
        background: colors.neutral[900],
        active: colors.primary[400],
        inactive: colors.neutral[500],
        border: colors.neutral[700],
      }
    : {
        background: colors.neutral[0],
        active: colors.primary[500],
        inactive: colors.neutral[500],
        border: colors.neutral[200],
      };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.active,
        tabBarInactiveTintColor: theme.inactive,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="quran"
        options={{
          title: "Kur'an",
          tabBarIcon: ({ color }) => <QuranIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="tefsir"
        options={{
          title: "Tefsir",
          tabBarIcon: ({ color }) => <TefsirIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: "Kartlar",
          tabBarIcon: ({ color }) => <LearnIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Ayarlar",
          tabBarIcon: ({ color }) => <SettingsIcon color={color} />,
        }}
      />
    </Tabs>
  );
}
