import { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { colors, typography, spacing } from "../../../src/theme";
import { Flashcard } from "../../../src/components";
import { useLearningStore, useSettingsStore } from "../../../src/stores";
import {
  initializeCardProgress,
  calculateNextReview,
  mapUserRatingToQuality,
  estimateNextInterval,
} from "../../../src/features/learning/spacedRepetition";
import type {
  LearningCategory,
  VocabularyWord,
  Phrase,
  UserRating,
} from "../../../src/types";

// Import learning data
import wordsData from "../../../src/data/learning/words_300.json";
import twogramData from "../../../src/data/learning/twogram.json";
import thregramData from "../../../src/data/learning/threegram.json";

const DATA_MAP: Record<LearningCategory, (VocabularyWord | Phrase)[]> = {
  words: wordsData as VocabularyWord[],
  twogram: twogramData as Phrase[],
  threegram: thregramData as Phrase[],
};

const CATEGORY_TITLES: Record<LearningCategory, string> = {
  words: "Kelimeler",
  twogram: "Ikili Ifadeler",
  threegram: "Uclu Ifadeler",
};

function CloseIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function SessionScreen() {
  const { category } = useLocalSearchParams<{ category: LearningCategory }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { primaryLanguage } = useSettingsStore();
  const {
    cardProgress,
    getCardProgress,
    updateCardProgress,
    incrementTodayReviewed,
    updateStreak,
  } = useLearningStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
  });
  const [isComplete, setIsComplete] = useState(false);

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

  // Get cards for this session
  const sessionCards = useMemo(() => {
    if (!category) return [];

    const allCards = DATA_MAP[category] || [];
    const now = new Date();

    // Get cards that are due for review or new
    const dueCards: (VocabularyWord | Phrase)[] = [];
    const newCards: (VocabularyWord | Phrase)[] = [];

    allCards.forEach((card) => {
      const progress = cardProgress[card.id];
      if (!progress) {
        newCards.push(card);
      } else if (new Date(progress.nextReviewDate) <= now) {
        dueCards.push(card);
      }
    });

    // Prioritize due cards, then add new cards (limit to 20)
    return [...dueCards, ...newCards].slice(0, 20);
  }, [category, cardProgress]);

  const currentCard = sessionCards[currentIndex];

  // Get interval previews for current card
  const intervalPreviews = useMemo(() => {
    if (!currentCard || !category) return undefined;

    const progress =
      getCardProgress(currentCard.id) ||
      initializeCardProgress(currentCard.id, category);

    return {
      again: estimateNextInterval(progress, "again"),
      hard: estimateNextInterval(progress, "hard"),
      good: estimateNextInterval(progress, "good"),
      easy: estimateNextInterval(progress, "easy"),
    };
  }, [currentCard, category, getCardProgress]);

  const handleRate = useCallback(
    (rating: UserRating) => {
      if (!currentCard || !category) return;

      // Get or create progress
      let progress =
        getCardProgress(currentCard.id) ||
        initializeCardProgress(currentCard.id, category);

      // Calculate next review
      const quality = mapUserRatingToQuality(rating);
      progress = calculateNextReview(progress, quality);

      // Update store
      updateCardProgress(progress);
      incrementTodayReviewed();
      updateStreak();

      // Update session stats
      setSessionStats((prev) => ({
        correct: quality >= 3 ? prev.correct + 1 : prev.correct,
        incorrect: quality < 3 ? prev.incorrect + 1 : prev.incorrect,
      }));

      // Move to next card or complete
      if (currentIndex < sessionCards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setIsComplete(true);
      }
    },
    [
      currentCard,
      category,
      currentIndex,
      sessionCards.length,
      getCardProgress,
      updateCardProgress,
      incrementTodayReviewed,
      updateStreak,
    ]
  );

  const handleClose = () => {
    router.back();
  };

  // Empty state
  if (sessionCards.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={styles.header}>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <CloseIcon color={theme.text} />
          </Pressable>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Tebrikler!
          </Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Su an tekrar edilecek kart yok. Daha sonra tekrar gel!
          </Text>
          <Pressable
            style={[styles.doneButton, { backgroundColor: colors.primary[500] }]}
            onPress={handleClose}
          >
            <Text style={styles.doneButtonText}>Tamam</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Completion screen
  if (isComplete) {
    const totalCards = sessionStats.correct + sessionStats.incorrect;
    const accuracy =
      totalCards > 0 ? Math.round((sessionStats.correct / totalCards) * 100) : 0;

    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={styles.completionContainer}>
          <Text style={[styles.completionEmoji]}>🎉</Text>
          <Text style={[styles.completionTitle, { color: theme.text }]}>
            Oturum Tamamlandi!
          </Text>

          <View style={[styles.statsCard, { backgroundColor: theme.card }]}>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Toplam Kart
              </Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {totalCards}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Dogru
              </Text>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {sessionStats.correct}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Yanlis
              </Text>
              <Text style={[styles.statValue, { color: colors.error }]}>
                {sessionStats.incorrect}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Basari
              </Text>
              <Text style={[styles.statValue, { color: colors.primary[500] }]}>
                %{accuracy}
              </Text>
            </View>
          </View>

          <Pressable
            style={[styles.doneButton, { backgroundColor: colors.primary[500] }]}
            onPress={handleClose}
          >
            <Text style={styles.doneButtonText}>Devam Et</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <CloseIcon color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {CATEGORY_TITLES[category || "words"]}
        </Text>
        <View style={styles.closeButton} />
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: theme.card }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${((currentIndex + 1) / sessionCards.length) * 100}%`,
                backgroundColor: colors.primary[500],
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: theme.textSecondary }]}>
          {currentIndex + 1} / {sessionCards.length}
        </Text>
      </View>

      {/* Flashcard */}
      {currentCard && (
        <Flashcard
          item={currentCard}
          language={primaryLanguage}
          onRate={handleRate}
          intervalPreviews={intervalPreviews}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
  },
  progressContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontSize: typography.labelSmall.fontSize,
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.body.fontSize,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  completionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  completionEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  completionTitle: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    marginBottom: spacing.xl,
  },
  statsCard: {
    width: "100%",
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  statLabel: {
    fontSize: typography.body.fontSize,
  },
  statValue: {
    fontSize: typography.body.fontSize,
    fontWeight: "600",
  },
  doneButton: {
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  doneButtonText: {
    color: "#fff",
    fontSize: typography.body.fontSize,
    fontWeight: "600",
  },
});
