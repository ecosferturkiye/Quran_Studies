import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  CardProgress,
  LearningCategory,
  LearningStats,
  MasteryLevel,
} from "../types";

interface LearningState {
  // Card Progress (keyed by card ID)
  cardProgress: Record<string, CardProgress>;

  // Stats
  streak: number;
  lastStudyDate: string | null;
  todayReviewed: number;
  todayDate: string;

  // Actions
  getCardProgress: (id: string) => CardProgress | undefined;
  updateCardProgress: (progress: CardProgress) => void;
  getCardsForReview: (category: LearningCategory, limit?: number) => string[];
  getStats: (category?: LearningCategory) => LearningStats;
  incrementTodayReviewed: () => void;
  updateStreak: () => void;
  resetDailyStats: () => void;
}

const getTodayDate = () => new Date().toISOString().split("T")[0];

export const useLearningStore = create<LearningState>()(
  persist(
    (set, get) => ({
      // Initial state
      cardProgress: {},
      streak: 0,
      lastStudyDate: null,
      todayReviewed: 0,
      todayDate: getTodayDate(),

      // Actions
      getCardProgress: (id) => get().cardProgress[id],

      updateCardProgress: (progress) =>
        set((state) => ({
          cardProgress: {
            ...state.cardProgress,
            [progress.id]: progress,
          },
        })),

      getCardsForReview: (category, limit = 20) => {
        const now = new Date();
        const progress = get().cardProgress;

        const dueCards = Object.values(progress)
          .filter(
            (card) =>
              card.category === category &&
              new Date(card.nextReviewDate) <= now
          )
          .sort((a, b) => {
            // Prioritize: new > learning > reviewing
            const priority = { new: 0, learning: 1, reviewing: 2, mastered: 3 };
            if (priority[a.masteryLevel] !== priority[b.masteryLevel]) {
              return priority[a.masteryLevel] - priority[b.masteryLevel];
            }
            return (
              new Date(a.nextReviewDate).getTime() -
              new Date(b.nextReviewDate).getTime()
            );
          })
          .slice(0, limit)
          .map((card) => card.id);

        return dueCards;
      },

      getStats: (category) => {
        const progress = get().cardProgress;
        const cards = Object.values(progress).filter(
          (card) => !category || card.category === category
        );

        const masteryCount = (level: MasteryLevel) =>
          cards.filter((c) => c.masteryLevel === level).length;

        return {
          totalCards: cards.length,
          masteredCards: masteryCount("mastered"),
          learningCards: masteryCount("learning"),
          newCards: masteryCount("new"),
          reviewingCards: masteryCount("reviewing"),
          streak: get().streak,
          lastStudyDate: get().lastStudyDate,
          todayReviewed: get().todayReviewed,
          dailyGoal: 20, // Will be fetched from settings
        };
      },

      incrementTodayReviewed: () => {
        const today = getTodayDate();
        const state = get();

        if (state.todayDate !== today) {
          // New day, reset counter
          set({ todayDate: today, todayReviewed: 1 });
        } else {
          set({ todayReviewed: state.todayReviewed + 1 });
        }
      },

      updateStreak: () => {
        const today = getTodayDate();
        const state = get();

        if (state.lastStudyDate === null) {
          // First study ever
          set({ streak: 1, lastStudyDate: today });
        } else if (state.lastStudyDate === today) {
          // Already studied today, no change
          return;
        } else {
          const lastDate = new Date(state.lastStudyDate);
          const todayDate = new Date(today);
          const diffDays = Math.floor(
            (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (diffDays === 1) {
            // Consecutive day
            set({ streak: state.streak + 1, lastStudyDate: today });
          } else {
            // Streak broken
            set({ streak: 1, lastStudyDate: today });
          }
        }
      },

      resetDailyStats: () => {
        const today = getTodayDate();
        set({ todayDate: today, todayReviewed: 0 });
      },
    }),
    {
      name: "learning-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
