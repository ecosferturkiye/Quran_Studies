import { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { colors, typography, spacing } from "../../../src/theme";
import { CategoryCard } from "../../../src/components";
import { useLearningStore } from "../../../src/stores";
import type { LearningCategory } from "../../../src/types";

// Import learning data
import wordsData from "../../../src/data/learning/words_300.json";
import twogramData from "../../../src/data/learning/twogram.json";
import thregramData from "../../../src/data/learning/threegram.json";

const CATEGORY_DATA: Record<LearningCategory, { data: unknown[]; count: number }> = {
  words: { data: wordsData, count: wordsData.length },
  twogram: { data: twogramData, count: twogramData.length },
  threegram: { data: thregramData, count: thregramData.length },
};

export default function LearnScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { cardProgress, getCardsForReview, streak, todayReviewed } = useLearningStore();

  const theme = isDark
    ? {
        background: colors.neutral[900],
        text: colors.neutral[50],
        textSecondary: colors.neutral[400],
        card: colors.neutral[800],
      }
    : {
        background: colors.neutral[0],
        text: colors.neutral[900],
        textSecondary: colors.neutral[600],
        card: colors.neutral[50],
      };

  // Calculate stats for each category
  const categoryStats = useMemo(() => {
    const stats: Record<
      LearningCategory,
      { total: number; mastered: number; due: number }
    > = {
      words: { total: CATEGORY_DATA.words.count, mastered: 0, due: 0 },
      twogram: { total: CATEGORY_DATA.twogram.count, mastered: 0, due: 0 },
      threegram: { total: CATEGORY_DATA.threegram.count, mastered: 0, due: 0 },
    };

    // Count mastered cards
    Object.values(cardProgress).forEach((card) => {
      if (card.masteryLevel === "mastered") {
        stats[card.category].mastered++;
      }
    });

    // Count due cards
    (["words", "twogram", "threegram"] as LearningCategory[]).forEach((cat) => {
      stats[cat].due = getCardsForReview(cat, 100).length;
    });

    return stats;
  }, [cardProgress, getCardsForReview]);

  const handleStartSession = (category: LearningCategory) => {
    router.push(`/learn/session?category=${category}`);
  };

  const totalMastered =
    categoryStats.words.mastered +
    categoryStats.twogram.mastered +
    categoryStats.threegram.mastered;

  const totalCards =
    categoryStats.words.total +
    categoryStats.twogram.total +
    categoryStats.threegram.total;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Arapca Ogren</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Flashcard ile kelime ve kaliplari ogren
          </Text>
        </View>

        {/* Daily Stats */}
        <View style={[styles.dailyStats, { backgroundColor: theme.card }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary[500] }]}>
              {streak}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Seri
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.success }]}>
              {todayReviewed}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Bugun
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.secondary[500] }]}>
              {totalMastered}/{totalCards}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Ogrenildi
            </Text>
          </View>
        </View>

        {/* Category Cards */}
        <View style={styles.categories}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Kategoriler
          </Text>

          <CategoryCard
            category="words"
            totalCards={categoryStats.words.total}
            masteredCards={categoryStats.words.mastered}
            dueCards={categoryStats.words.due}
            onPress={() => handleStartSession("words")}
          />

          <CategoryCard
            category="twogram"
            totalCards={categoryStats.twogram.total}
            masteredCards={categoryStats.twogram.mastered}
            dueCards={categoryStats.twogram.due}
            onPress={() => handleStartSession("twogram")}
          />

          <CategoryCard
            category="threegram"
            totalCards={categoryStats.threegram.total}
            masteredCards={categoryStats.threegram.mastered}
            dueCards={categoryStats.threegram.due}
            onPress={() => handleStartSession("threegram")}
          />
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
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.lg,
    alignItems: "center",
  },
  title: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    textAlign: "center",
  },
  dailyStats: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: typography.h3.fontSize,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: typography.labelSmall.fontSize,
    marginTop: spacing.xs,
  },
  divider: {
    width: 1,
    backgroundColor: "rgba(128,128,128,0.2)",
    marginHorizontal: spacing.md,
  },
  categories: {
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
    marginBottom: spacing.md,
  },
});
