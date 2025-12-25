import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  FlatList,
  TextInput,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useMemo, useCallback } from "react";
import { router } from "expo-router";
import { colors, typography, spacing } from "../../../src/theme";
import { surahs, Surah } from "../../../src/data/surahs";
import { Ionicons } from "@expo/vector-icons";

interface ThemeColors {
  background: string;
  cardBackground: string;
  text: string;
  textSecondary: string;
  primary: string;
  border: string;
  inputBackground: string;
  mekki: string;
  medeni: string;
}

function SurahCard({
  surah,
  theme,
  onPress,
}: {
  surah: Surah;
  theme: ThemeColors;
  onPress: () => void;
}) {
  const isMekki = surah.revelationType === "Mekki";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.surahCard,
        { backgroundColor: theme.cardBackground },
        pressed && styles.surahCardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${surah.nameTurkish}, ${surah.ayahCount} ayet, ${surah.revelationType}`}
    >
      <View style={[styles.surahNumber, { backgroundColor: theme.primary }]}>
        <Text style={styles.surahNumberText}>{surah.id}</Text>
      </View>

      <View style={styles.surahInfo}>
        <Text style={[styles.surahNameTurkish, { color: theme.text }]} numberOfLines={1}>
          {surah.nameTurkish}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.surahMeta, { color: theme.textSecondary }]}>
            {surah.ayahCount} ayet
          </Text>
          <View
            style={[
              styles.revelationBadge,
              { backgroundColor: isMekki ? theme.mekki : theme.medeni }
            ]}
          >
            <Text style={[styles.revelationText, { color: isMekki ? "#7C3AED" : "#16A34A" }]}>
              {surah.revelationType}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.surahArabic}>
        <Text style={[styles.surahNameArabic, { color: theme.text }]}>
          {surah.nameArabic}
        </Text>
        <Text style={[styles.surahPage, { color: theme.textSecondary }]}>
          Sayfa {surah.page}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color={theme.textSecondary}
        style={styles.chevron}
      />
    </Pressable>
  );
}

function EmptyState({ theme, query }: { theme: ThemeColors; query: string }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={48} color={theme.textSecondary} />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        Sonuç bulunamadı
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        "{query}" için sure bulunamadı
      </Text>
    </View>
  );
}

export default function QuranScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [searchQuery, setSearchQuery] = useState("");

  const theme: ThemeColors = isDark
    ? {
        background: colors.neutral[900],
        cardBackground: colors.neutral[800],
        text: colors.neutral[50],
        textSecondary: colors.neutral[400],
        primary: colors.primary[500],
        border: colors.neutral[700],
        inputBackground: colors.neutral[800],
        mekki: "rgba(139, 92, 246, 0.2)",
        medeni: "rgba(34, 197, 94, 0.2)",
      }
    : {
        background: colors.neutral[50],
        cardBackground: colors.neutral[0],
        text: colors.neutral[900],
        textSecondary: colors.neutral[600],
        primary: colors.primary[500],
        border: colors.neutral[200],
        inputBackground: colors.neutral[100],
        mekki: "rgba(139, 92, 246, 0.15)",
        medeni: "rgba(34, 197, 94, 0.15)",
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

  const handleSurahPress = useCallback((surah: Surah) => {
    router.push({
      pathname: "/(tabs)/quran/[surahId]",
      params: { surahId: surah.id.toString() },
    });
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Surah }) => (
      <SurahCard
        surah={item}
        theme={theme}
        onPress={() => handleSurahPress(item)}
      />
    ),
    [theme, handleSurahPress]
  );

  const keyExtractor = useCallback((item: Surah) => item.id.toString(), []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Kur'an-ı Kerim</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          114 Sure • 6236 Ayet
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchInputWrapper,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.border,
            },
          ]}
        >
          <Ionicons
            name="search"
            size={20}
            color={theme.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Sure adı veya numara ile ara..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Sure ara"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={clearSearch}
              style={styles.clearButton}
              accessibilityLabel="Aramayı temizle"
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>
        {searchQuery.length > 0 && (
          <Text style={[styles.resultCount, { color: theme.textSecondary }]}>
            {filteredSurahs.length} sure bulundu
          </Text>
        )}
      </View>

      <FlatList
        data={filteredSurahs}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          filteredSurahs.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={true}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          searchQuery.length > 0 ? (
            <EmptyState theme={theme} query={searchQuery} />
          ) : null
        }
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    alignItems: "center",
  },
  title: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: "500",
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    height: "100%",
    fontWeight: "400",
  },
  clearButton: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
  },
  resultCount: {
    fontSize: 14,
    marginTop: spacing.sm,
    marginLeft: spacing.sm,
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: "center",
  },
  separator: {
    height: spacing.md,
  },
  surahCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 80,
  },
  surahCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  surahNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  surahNumberText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  surahInfo: {
    flex: 1,
    marginLeft: spacing.lg,
    justifyContent: "center",
  },
  surahNameTurkish: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  surahMeta: {
    fontSize: 14,
    fontWeight: "500",
  },
  revelationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  revelationText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  surahArabic: {
    alignItems: "flex-end",
    marginRight: spacing.sm,
  },
  surahNameArabic: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 4,
  },
  surahPage: {
    fontSize: 13,
    fontWeight: "500",
  },
  chevron: {
    marginLeft: spacing.xs,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing["3xl"],
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
});
