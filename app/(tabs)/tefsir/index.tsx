import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  FlatList,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useMemo } from "react";
import { router } from "expo-router";
import { colors, typography, spacing } from "../../../src/theme";
import { surahs, Surah } from "../../../src/data/surahs";

function SurahCard({
  surah,
  theme,
  onPress,
}: {
  surah: Surah;
  theme: any;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.surahCard, { backgroundColor: theme.cardBackground }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.surahNumber, { backgroundColor: theme.primary }]}>
        <Text style={styles.surahNumberText}>{surah.id}</Text>
      </View>

      <View style={styles.surahInfo}>
        <Text style={[styles.surahNameTurkish, { color: theme.text }]}>
          {surah.nameTurkish}
        </Text>
        <Text style={[styles.surahMeta, { color: theme.textSecondary }]}>
          {surah.ayahCount} ayet
        </Text>
      </View>

      <View style={styles.surahArabic}>
        <Text style={[styles.surahNameArabic, { color: theme.text }]}>
          {surah.nameArabic}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function TefsirScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [searchQuery, setSearchQuery] = useState("");

  const theme = isDark
    ? {
        background: colors.neutral[900],
        cardBackground: colors.neutral[800],
        text: colors.neutral[50],
        textSecondary: colors.neutral[400],
        primary: "#8B5CF6",
        border: colors.neutral[700],
        inputBackground: colors.neutral[800],
      }
    : {
        background: colors.neutral[50],
        cardBackground: colors.neutral[0],
        text: colors.neutral[900],
        textSecondary: colors.neutral[600],
        primary: "#8B5CF6",
        border: colors.neutral[200],
        inputBackground: colors.neutral[100],
      };

  const filteredSurahs = useMemo(() => {
    if (!searchQuery.trim()) return surahs;

    const query = searchQuery.toLowerCase().trim();
    return surahs.filter(
      (surah) =>
        surah.nameTurkish.toLowerCase().includes(query) ||
        surah.nameArabic.includes(query) ||
        surah.nameEnglish.toLowerCase().includes(query) ||
        surah.id.toString() === query
    );
  }, [searchQuery]);

  const handleSurahPress = (surah: Surah) => {
    router.push({
      pathname: "/(tabs)/tefsir/[surahId]",
      params: { surahId: surah.id.toString() },
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Tefsir</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Study Quran, Kur'an Yolu & Hayrat Tefsiri
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.inputBackground,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          placeholder="Sure ara..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredSurahs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <SurahCard
            surah={item}
            theme={theme}
            onPress={() => handleSurahPress(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    alignItems: "center",
  },
  title: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  searchInput: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    borderWidth: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  separator: {
    height: spacing.sm,
  },
  surahCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  surahNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  surahNumberText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  surahInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  surahNameTurkish: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  surahMeta: {
    fontSize: 13,
  },
  surahArabic: {
    alignItems: "flex-end",
  },
  surahNameArabic: {
    fontSize: 18,
    fontWeight: "500",
  },
});
