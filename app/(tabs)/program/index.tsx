import { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Pressable,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing } from "../../../src/theme";
import { useProgramStore } from "../../../src/stores/programStore";
import { useLearningStore } from "../../../src/stores";
import type { VocabularyWord } from "../../../src/types";

// Import word data
import wordsData from "../../../src/data/learning/words_300.json";

interface ThemeColors {
  background: string;
  text: string;
  textSecondary: string;
  card: string;
  border: string;
}

const DAY_NAMES = ["Paz", "Pzt", "Sal", "Car", "Per", "Cum", "Cmt"];

export default function ProgramScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [showWordPopup, setShowWordPopup] = useState(false);

  const {
    getProgressForDate,
    getProgressForWeek,
    getActiveGoal,
    getStats,
    currentStreak,
  } = useProgramStore();

  const { cardProgress, getCardsForReview, todayReviewed, streak: learningStreak } = useLearningStore();

  const theme: ThemeColors = isDark
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

  const today = new Date().toISOString().split("T")[0];
  const todayProgress = getProgressForDate(today);
  const weekProgress = getProgressForWeek();
  const stats = getStats();
  const dailyGoal = getActiveGoal("daily");

  // Get current word to learn
  const currentWord = useMemo(() => {
    const dueCards = getCardsForReview("words", 1);
    if (dueCards.length > 0) {
      const cardId = dueCards[0];
      return (wordsData as VocabularyWord[]).find((w) => w.id === cardId);
    }
    // If no due cards, get the first unlearned word
    const learnedIds = new Set(Object.keys(cardProgress));
    const unlearnedWord = (wordsData as VocabularyWord[]).find(
      (w) => !learnedIds.has(w.id)
    );
    return unlearnedWord || (wordsData as VocabularyWord[])[0];
  }, [cardProgress, getCardsForReview]);

  // Show popup when screen opens
  useEffect(() => {
    if (currentWord) {
      const timer = setTimeout(() => setShowWordPopup(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const goalProgress = useMemo(() => {
    if (!dailyGoal) return 0;
    return Math.min(100, (todayProgress.totalVerses / dailyGoal.target) * 100);
  }, [dailyGoal, todayProgress]);

  const handleAddReading = () => {
    router.push("/program/log");
  };

  const handleGoToFlashcards = () => {
    setShowWordPopup(false);
    router.push("/learn");
  };

  // Count mastered words
  const masteredCount = Object.values(cardProgress).filter(
    (c) => c.category === "words" && c.masteryLevel === "mastered"
  ).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={true} style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Okuma Programi</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Gunluk Kur'an okuma takibi
          </Text>
        </View>

        {/* Daily Stats */}
        <View style={[styles.dailyStats, { backgroundColor: theme.card }]}>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="flame" size={20} color={colors.primary[500]} />
            </View>
            <Text style={[styles.statNumber, { color: colors.primary[500] }]}>
              {currentStreak}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Gunluk Seri
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="book" size={20} color={colors.success} />
            </View>
            <Text style={[styles.statNumber, { color: colors.success }]}>
              {todayProgress.totalVerses}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Bugun Okunan
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="stats-chart" size={20} color={colors.secondary[500]} />
            </View>
            <Text style={[styles.statNumber, { color: colors.secondary[500] }]}>
              {stats.totalVerses}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Toplam Ayet
            </Text>
          </View>
        </View>

        {/* Current Word Card */}
        <Pressable
          style={[styles.wordCard, { backgroundColor: theme.card }]}
          onPress={() => setShowWordPopup(true)}
        >
          <View style={styles.wordCardHeader}>
            <View style={styles.wordCardTitleRow}>
              <Ionicons name="language" size={20} color={colors.primary[500]} />
              <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>
                Siradaki Kelime
              </Text>
            </View>
            <View style={styles.wordBadge}>
              <Text style={styles.wordBadgeText}>{masteredCount}/300</Text>
            </View>
          </View>
          {currentWord && (
            <View style={styles.wordPreview}>
              <Text style={[styles.wordArabic, { color: theme.text }]}>
                {currentWord.arabic}
              </Text>
              <Text style={[styles.wordMeaning, { color: theme.textSecondary }]}>
                {currentWord.translations.tr}
              </Text>
            </View>
          )}
          <Text style={[styles.wordHint, { color: colors.primary[500] }]}>
            Kartlara git →
          </Text>
        </Pressable>

        {/* Today's Details */}
        <View style={[styles.todayCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Bugunun Detayi
          </Text>
          <View style={styles.todayDetails}>
            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: colors.primary[100] }]}>
                <Text style={styles.detailEmoji}>📖</Text>
              </View>
              <Text style={[styles.detailLabel, { color: theme.text }]}>Meal</Text>
              <Text style={[styles.detailValue, { color: theme.textSecondary }]}>
                {todayProgress.mealVerses} ayet
              </Text>
            </View>
            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: colors.secondary[100] }]}>
                <Text style={styles.detailEmoji}>📜</Text>
              </View>
              <Text style={[styles.detailLabel, { color: theme.text }]}>Tefsir</Text>
              <Text style={[styles.detailValue, { color: theme.textSecondary }]}>
                {todayProgress.tefsirVerses} ayet
              </Text>
            </View>
          </View>
        </View>

        {/* Daily Goal Progress */}
        {dailyGoal && (
          <View style={[styles.goalCard, { backgroundColor: theme.card }]}>
            <View style={styles.goalHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Gunluk Hedef
              </Text>
              <Text style={[styles.goalPercent, { color: colors.primary[500] }]}>
                %{Math.round(goalProgress)}
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${goalProgress}%`,
                    backgroundColor: colors.primary[500],
                  },
                ]}
              />
            </View>
            <Text style={[styles.goalDetail, { color: theme.textSecondary }]}>
              {todayProgress.totalVerses} / {dailyGoal.target} ayet
            </Text>
          </View>
        )}

        {/* Weekly Overview */}
        <View style={[styles.weekCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Son 7 Gun
          </Text>
          <View style={styles.weekGrid}>
            {weekProgress.map((day, index) => {
              const date = new Date(day.date);
              const dayName = DAY_NAMES[date.getDay()];
              const isToday = day.date === today;
              const hasReading = day.totalVerses > 0;

              return (
                <View key={day.date} style={styles.dayColumn}>
                  <Text style={[styles.dayName, { color: theme.textSecondary }]}>
                    {dayName}
                  </Text>
                  <View
                    style={[
                      styles.dayCircle,
                      {
                        backgroundColor: hasReading
                          ? colors.primary[500]
                          : theme.border,
                        borderWidth: isToday ? 2 : 0,
                        borderColor: colors.primary[300],
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        { color: hasReading ? "#fff" : theme.textSecondary },
                      ]}
                    >
                      {day.totalVerses || "-"}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Set Goal Button (if no goal) */}
        {!dailyGoal && (
          <Pressable
            style={[styles.setGoalButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => {
              useProgramStore.getState().setGoal({
                type: "daily",
                target: 10,
                readingType: "all",
                isActive: true,
              });
            }}
          >
            <Ionicons name="flag-outline" size={24} color={colors.primary[500]} />
            <Text style={[styles.setGoalText, { color: theme.text }]}>
              Gunluk Hedef Belirle
            </Text>
          </Pressable>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* FAB - Add Reading */}
      <Pressable
        style={[styles.fab, { backgroundColor: colors.primary[500] }]}
        onPress={handleAddReading}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      {/* Word Popup Modal */}
      <Modal
        visible={showWordPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWordPopup(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowWordPopup(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Siradaki Kelime
              </Text>
              <Pressable onPress={() => setShowWordPopup(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            {currentWord && (
              <>
                <Text style={[styles.modalArabic, { color: theme.text }]}>
                  {currentWord.arabic}
                </Text>
                <Text style={[styles.modalMeaning, { color: theme.textSecondary }]}>
                  {currentWord.translations.tr}
                </Text>
                <Text style={[styles.modalFrequency, { color: theme.textSecondary }]}>
                  Kur'an'da {currentWord.frequency} kez gecmektedir
                </Text>
              </>
            )}

            <View style={styles.modalStats}>
              <View style={styles.modalStatItem}>
                <Text style={[styles.modalStatNumber, { color: colors.primary[500] }]}>
                  {masteredCount}
                </Text>
                <Text style={[styles.modalStatLabel, { color: theme.textSecondary }]}>
                  Ogrenildi
                </Text>
              </View>
              <View style={styles.modalStatItem}>
                <Text style={[styles.modalStatNumber, { color: colors.success }]}>
                  {todayReviewed}
                </Text>
                <Text style={[styles.modalStatLabel, { color: theme.textSecondary }]}>
                  Bugun
                </Text>
              </View>
              <View style={styles.modalStatItem}>
                <Text style={[styles.modalStatNumber, { color: colors.warning }]}>
                  {learningStreak}
                </Text>
                <Text style={[styles.modalStatLabel, { color: theme.textSecondary }]}>
                  Seri
                </Text>
              </View>
            </View>

            <Pressable
              style={[styles.modalButton, { backgroundColor: colors.primary[500] }]}
              onPress={handleGoToFlashcards}
            >
              <Ionicons name="school" size={20} color="#fff" />
              <Text style={styles.modalButtonText}>Kartlara Git</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
  wordCard: {
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  wordCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  wordCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  wordBadge: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  wordBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  wordPreview: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  wordArabic: {
    fontSize: 36,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  wordMeaning: {
    fontSize: 16,
  },
  wordHint: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
    marginTop: spacing.sm,
  },
  todayCard: {
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
    marginBottom: spacing.md,
  },
  todayDetails: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  detailEmoji: {
    fontSize: 18,
  },
  detailLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 15,
  },
  goalCard: {
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  goalPercent: {
    fontSize: 16,
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
  goalDetail: {
    fontSize: 13,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  weekCard: {
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  weekGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayColumn: {
    alignItems: "center",
    gap: spacing.xs,
  },
  dayName: {
    fontSize: 12,
    fontWeight: "500",
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: "600",
  },
  setGoalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  setGoalText: {
    fontSize: 15,
    fontWeight: "500",
  },
  bottomPadding: {
    height: 100,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: "center",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalArabic: {
    fontSize: 48,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  modalMeaning: {
    fontSize: 20,
    marginBottom: spacing.sm,
  },
  modalFrequency: {
    fontSize: 14,
    marginBottom: spacing.xl,
  },
  modalStats: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
    marginBottom: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(128,128,128,0.2)",
  },
  modalStatItem: {
    alignItems: "center",
  },
  modalStatNumber: {
    fontSize: 24,
    fontWeight: "700",
  },
  modalStatLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    width: "100%",
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
