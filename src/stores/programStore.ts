import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  ReadingSession,
  ReadingGoal,
  DailyProgress,
  ReadingStats,
  ReadingType,
  GoalType,
} from "../types/program";

interface ProgramState {
  // Data
  sessions: ReadingSession[];
  goals: ReadingGoal[];

  // Stats
  currentStreak: number;
  longestStreak: number;
  lastReadDate: string | null;

  // Actions
  addSession: (session: Omit<ReadingSession, "id" | "timestamp">) => void;
  removeSession: (sessionId: string) => void;

  setGoal: (goal: Omit<ReadingGoal, "id" | "createdAt">) => void;
  updateGoal: (goalId: string, updates: Partial<ReadingGoal>) => void;
  removeGoal: (goalId: string) => void;

  getProgressForDate: (date: string) => DailyProgress;
  getProgressForWeek: () => DailyProgress[];
  getActiveGoal: (type: GoalType) => ReadingGoal | undefined;

  getStats: () => ReadingStats;
  checkAndUpdateStreak: () => void;
}

const getTodayDate = () => new Date().toISOString().split("T")[0];

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useProgramStore = create<ProgramState>()(
  persist(
    (set, get) => ({
      // Initial state
      sessions: [],
      goals: [],
      currentStreak: 0,
      longestStreak: 0,
      lastReadDate: null,

      // Add a reading session
      addSession: (sessionData) => {
        const session: ReadingSession = {
          ...sessionData,
          id: generateId(),
          timestamp: Date.now(),
        };

        set((state) => ({
          sessions: [...state.sessions, session],
        }));

        // Update streak after adding session
        get().checkAndUpdateStreak();
      },

      // Remove a session
      removeSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
        }));
      },

      // Set a goal
      setGoal: (goalData) => {
        const goal: ReadingGoal = {
          ...goalData,
          id: generateId(),
          createdAt: Date.now(),
        };

        set((state) => {
          // Deactivate existing goals of same type
          const updatedGoals = state.goals.map((g) =>
            g.type === goalData.type ? { ...g, isActive: false } : g
          );
          return {
            goals: [...updatedGoals, goal],
          };
        });
      },

      // Update a goal
      updateGoal: (goalId, updates) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === goalId ? { ...g, ...updates } : g
          ),
        }));
      },

      // Remove a goal
      removeGoal: (goalId) => {
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== goalId),
        }));
      },

      // Get progress for a specific date
      getProgressForDate: (date) => {
        const sessions = get().sessions.filter((s) => s.date === date);

        const mealVerses = sessions
          .filter((s) => s.type === "meal")
          .reduce((sum, s) => sum + s.verseCount, 0);

        const tefsirVerses = sessions
          .filter((s) => s.type === "tefsir")
          .reduce((sum, s) => sum + s.verseCount, 0);

        return {
          date,
          mealVerses,
          tefsirVerses,
          totalVerses: mealVerses + tefsirVerses,
          sessions,
        };
      },

      // Get progress for last 7 days
      getProgressForWeek: () => {
        const days: DailyProgress[] = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split("T")[0];
          days.push(get().getProgressForDate(dateStr));
        }

        return days;
      },

      // Get active goal by type
      getActiveGoal: (type) => {
        return get().goals.find((g) => g.type === type && g.isActive);
      },

      // Get overall stats
      getStats: () => {
        const sessions = get().sessions;
        const totalVerses = sessions.reduce((sum, s) => sum + s.verseCount, 0);

        // Calculate average daily (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentSessions = sessions.filter(
          (s) => new Date(s.date) >= thirtyDaysAgo
        );
        const recentTotal = recentSessions.reduce(
          (sum, s) => sum + s.verseCount,
          0
        );
        const averageDaily = Math.round(recentTotal / 30);

        return {
          totalVerses,
          totalSessions: sessions.length,
          currentStreak: get().currentStreak,
          longestStreak: get().longestStreak,
          averageDaily,
        };
      },

      // Check and update streak
      checkAndUpdateStreak: () => {
        const today = getTodayDate();
        const state = get();

        if (state.lastReadDate === null) {
          // First reading ever
          set({
            currentStreak: 1,
            longestStreak: 1,
            lastReadDate: today,
          });
        } else if (state.lastReadDate === today) {
          // Already read today, no change
          return;
        } else {
          const lastDate = new Date(state.lastReadDate);
          const todayDate = new Date(today);
          const diffDays = Math.floor(
            (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (diffDays === 1) {
            // Consecutive day
            const newStreak = state.currentStreak + 1;
            set({
              currentStreak: newStreak,
              longestStreak: Math.max(newStreak, state.longestStreak),
              lastReadDate: today,
            });
          } else {
            // Streak broken
            set({
              currentStreak: 1,
              lastReadDate: today,
            });
          }
        }
      },
    }),
    {
      name: "program-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
