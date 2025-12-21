import { View, Text, StyleSheet, useColorScheme, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing } from "../../../src/theme";

interface SettingsRowProps {
  title: string;
  value: string;
  theme: {
    text: string;
    textSecondary: string;
    border: string;
  };
}

function SettingsRow({ title, value, theme }: SettingsRowProps) {
  return (
    <View style={[styles.settingsRow, { borderBottomColor: theme.border }]}>
      <Text style={[styles.settingsTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.settingsValue, { color: theme.textSecondary }]}>{value}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const theme = isDark
    ? {
        background: colors.neutral[900],
        text: colors.neutral[50],
        textSecondary: colors.neutral[400],
        card: colors.neutral[800],
        border: colors.neutral[700],
      }
    : {
        background: colors.neutral[0],
        text: colors.neutral[900],
        textSecondary: colors.neutral[600],
        card: colors.neutral[50],
        border: colors.neutral[200],
      };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Ayarlar</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            GORUNUM
          </Text>
          <SettingsRow title="Tema" value="Sistem" theme={theme} />
          <SettingsRow title="Yazi Boyutu" value="Orta" theme={theme} />
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            DIL
          </Text>
          <SettingsRow title="Birincil Dil" value="Turkce" theme={theme} />
          <SettingsRow title="Ikincil Dil" value="Ingilizce" theme={theme} />
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            SES
          </Text>
          <SettingsRow title="Oynatma Hizi" value="1.0x" theme={theme} />
          <SettingsRow title="Tekrar Modu" value="Kapal" theme={theme} />
          <SettingsRow title="Otomatik Ilerleme" value="Acik" theme={theme} />
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            INDIRMELER
          </Text>
          <SettingsRow title="Indirilen" value="0 / 30 Cuz" theme={theme} />
          <SettingsRow title="Kullanilan Alan" value="0 MB" theme={theme} />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Next Linear Quran v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing["2xl"],
    alignItems: "center",
  },
  title: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
  },
  content: {
    flex: 1,
  },
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: 12,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: typography.labelSmall.fontSize,
    fontWeight: typography.labelSmall.fontWeight,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  settingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  settingsTitle: {
    fontSize: typography.body.fontSize,
  },
  settingsValue: {
    fontSize: typography.body.fontSize,
  },
  footer: {
    alignItems: "center",
    paddingVertical: spacing["2xl"],
  },
  footerText: {
    fontSize: typography.bodySmall.fontSize,
  },
});
