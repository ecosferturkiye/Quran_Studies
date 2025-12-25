import { View, Text, StyleSheet, useColorScheme, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing } from "../../../src/theme";
import { Ionicons } from "@expo/vector-icons";

interface ThemeColors {
  background: string;
  text: string;
  textSecondary: string;
  card: string;
  border: string;
  primary: string;
}

interface SettingsRowProps {
  title: string;
  value: string;
  theme: ThemeColors;
  icon?: keyof typeof Ionicons.glyphMap;
  showChevron?: boolean;
  onPress?: () => void;
}

function SettingsRow({ title, value, theme, icon, showChevron = true, onPress }: SettingsRowProps) {
  const content = (
    <View style={[styles.settingsRow, { borderBottomColor: theme.border }]}>
      <View style={styles.settingsRowLeft}>
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={theme.primary}
            style={styles.settingsIcon}
          />
        )}
        <Text style={[styles.settingsTitle, { color: theme.text }]}>{title}</Text>
      </View>
      <View style={styles.settingsRowRight}>
        <Text style={[styles.settingsValue, { color: theme.textSecondary }]}>{value}</Text>
        {showChevron && (
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => pressed && styles.settingsRowPressed}
        accessibilityRole="button"
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

interface SectionHeaderProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  theme: ThemeColors;
}

function SectionHeader({ title, icon, theme }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={16} color={theme.textSecondary} />
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        {title}
      </Text>
    </View>
  );
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const theme: ThemeColors = isDark
    ? {
        background: colors.neutral[900],
        text: colors.neutral[50],
        textSecondary: colors.neutral[400],
        card: colors.neutral[800],
        border: colors.neutral[700],
        primary: colors.primary[500],
      }
    : {
        background: colors.neutral[0],
        text: colors.neutral[900],
        textSecondary: colors.neutral[600],
        card: colors.neutral[50],
        border: colors.neutral[200],
        primary: colors.primary[500],
      };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Ayarlar</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <SectionHeader title="GÖRÜNÜM" icon="color-palette-outline" theme={theme} />
          <SettingsRow
            title="Tema"
            value="Sistem"
            theme={theme}
            icon="moon-outline"
          />
          <SettingsRow
            title="Yazı Boyutu"
            value="Orta"
            theme={theme}
            icon="text-outline"
          />
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <SectionHeader title="DİL" icon="language-outline" theme={theme} />
          <SettingsRow
            title="Birincil Dil"
            value="Türkçe"
            theme={theme}
            icon="flag-outline"
          />
          <SettingsRow
            title="İkincil Dil"
            value="İngilizce"
            theme={theme}
            icon="earth-outline"
          />
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <SectionHeader title="SES" icon="volume-high-outline" theme={theme} />
          <SettingsRow
            title="Oynatma Hızı"
            value="1.0x"
            theme={theme}
            icon="speedometer-outline"
          />
          <SettingsRow
            title="Tekrar Modu"
            value="Kapalı"
            theme={theme}
            icon="repeat-outline"
          />
          <SettingsRow
            title="Otomatik İlerleme"
            value="Açık"
            theme={theme}
            icon="play-forward-outline"
          />
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <SectionHeader title="İNDİRMELER" icon="cloud-download-outline" theme={theme} />
          <SettingsRow
            title="İndirilen"
            value="0 / 30 Cüz"
            theme={theme}
            icon="folder-outline"
            showChevron={false}
          />
          <SettingsRow
            title="Kullanılan Alan"
            value="0 MB"
            theme={theme}
            icon="pie-chart-outline"
            showChevron={false}
          />
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <SectionHeader title="HAKKINDA" icon="information-circle-outline" theme={theme} />
          <SettingsRow
            title="Sürüm"
            value="1.0.0"
            theme={theme}
            icon="code-slash-outline"
            showChevron={false}
          />
          <SettingsRow
            title="Geri Bildirim"
            value=""
            theme={theme}
            icon="chatbubble-outline"
          />
        </View>

        <View style={styles.footer}>
          <Ionicons name="book" size={24} color={theme.primary} />
          <Text style={[styles.footerTitle, { color: theme.text }]}>
            Next Linear Quran
          </Text>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Kur'an okuma ve öğrenme uygulaması
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: "center",
  },
  title: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
  },
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.labelSmall.fontSize,
    fontWeight: typography.labelSmall.fontWeight,
    letterSpacing: 0.5,
  },
  settingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    minHeight: 52,
  },
  settingsRowPressed: {
    opacity: 0.7,
  },
  settingsRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingsRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  settingsIcon: {
    marginRight: spacing.md,
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
    paddingBottom: spacing["2xl"],
    gap: spacing.xs,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: spacing.sm,
  },
  footerText: {
    fontSize: typography.bodySmall.fontSize,
  },
});
