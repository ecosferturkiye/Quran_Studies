import { useMemo, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { colors, typography, spacing } from "../../../src/theme";
import { CategoryCard } from "../../../src/components";
import { useLearningStore } from "../../../src/stores";
import type { LearningCategory } from "../../../src/types";
import { Ionicons } from "@expo/vector-icons";

import wordsData from "../../../src/data/learning/words_300.json";
import twogramData from "../../../src/data/learning/twogram.json";
import thregramData from "../../../src/data/learning/threegram.json";

const CATEGORY_DATA: Record<LearningCategory, { data: unknown[]; count: number }> = {
  words: { data: wordsData, count: wordsData.length },
  twogram: { data: twogramData, count: twogramData.length },
  threegram: { data: thregramData, count: thregramData.length },
};

interface ThemeColors {
  background: string;
  text: string;
  textSecondary: string;
  card: string;
}

export default function LearnScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { cardProgress, getCardsForReview, streak, todayReviewed } = useLearningStore();

  const theme: ThemeColors = isDark
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

  const handleStartSession = useCallback((category: LearningCategory) => {
    router.push(`/learn/session?category=${category}`);
  }, []);

  const totalMastered =
    categoryStats.words.mastered +
    categoryStats.twogram.mastered +
    categoryStats.threegram.mastered;

  const totalCards =
    categoryStats.words.total +
    categoryStats.twogram.total +
    categoryStats.threegram.total;

  const progressPercent = totalCards > 0 ? (totalMastered / totalCards) * 100 : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={true} style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Kelime Kartları</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Flashcard ile Kur'an kelimelerini öğren
          </Text>
        </View>

        <View style={[styles.dailyStats, { backgroundColor: theme.card }]}>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="flame" size={20} color={colors.primary[500]} />
            </View>
            <Text style={[styles.statNumber, { color: colors.primary[500] }]}>
              {streak}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Günlük Seri
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            </View>
            <Text style={[styles.statNumber, { color: colors.success }]}>
              {todayReviewed}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Bugün Tekrar
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="school" size={20} color={colors.secondary[500]} />
            </View>
            <Text style={[styles.statNumber, { color: colors.secondary[500] }]}>
              {totalMastered}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Öğrenildi
            </Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressTitle, { color: theme.text }]}>
              Toplam İlerleme
            </Text>
            <Text style={[styles.progressPercent, { color: theme.textSecondary }]}>
              %{Math.round(progressPercent)}
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: theme.card }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercent}%`,
                  backgroundColor: colors.primary[500],
                },
              ]}
            />
          </View>
          <Text style={[styles.progressDetail, { color: theme.textSecondary }]}>
            {totalMastered} / {totalCards} kart tamamlandı
          </Text>
        </View>

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
  scrollView: {
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
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    textAlign: "center",
    opacity: 0.8,
  },
  dailyStats: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statIconContainer: {
    marginBottom: spacing.xs,
  },
  statNumber: {
    fontSize: typography.h3.fontSize,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: typography.labelSmall.fontSize,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  divider: {
    width: 1,
    backgroundColor: "rgba(128,128,128,0.2)",
    marginHorizontal: spacing.sm,
  },
  progressSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: "600",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressDetail: {
    fontSize: 13,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  categories: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
    marginBottom: spacing.md,
  },
});
