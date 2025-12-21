import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SupportedLanguage } from "../types";

interface SettingsState {
  // Appearance
  theme: "light" | "dark" | "system";
  fontSize: "small" | "medium" | "large";

  // Language
  primaryLanguage: SupportedLanguage;
  secondaryLanguage: SupportedLanguage | null;

  // Quran Settings
  showTranslation: boolean;
  autoAdvance: boolean;
  playbackSpeed: number;
  repeatMode: "none" | "ayah" | "page" | "range";

  // General
  hapticFeedback: boolean;
  onboardingCompleted: boolean;

  // Learning
  dailyGoal: number;

  // Actions
  setTheme: (theme: "light" | "dark" | "system") => void;
  setFontSize: (size: "small" | "medium" | "large") => void;
  setPrimaryLanguage: (lang: SupportedLanguage) => void;
  setSecondaryLanguage: (lang: SupportedLanguage | null) => void;
  setShowTranslation: (show: boolean) => void;
  setAutoAdvance: (auto: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  setRepeatMode: (mode: "none" | "ayah" | "page" | "range") => void;
  setHapticFeedback: (enabled: boolean) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setDailyGoal: (goal: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Default values
      theme: "system",
      fontSize: "medium",
      primaryLanguage: "tr",
      secondaryLanguage: "en",
      showTranslation: true,
      autoAdvance: true,
      playbackSpeed: 1.0,
      repeatMode: "none",
      hapticFeedback: true,
      onboardingCompleted: false,
      dailyGoal: 20,

      // Actions
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setPrimaryLanguage: (primaryLanguage) => set({ primaryLanguage }),
      setSecondaryLanguage: (secondaryLanguage) => set({ secondaryLanguage }),
      setShowTranslation: (showTranslation) => set({ showTranslation }),
      setAutoAdvance: (autoAdvance) => set({ autoAdvance }),
      setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
      setRepeatMode: (repeatMode) => set({ repeatMode }),
      setHapticFeedback: (hapticFeedback) => set({ hapticFeedback }),
      setOnboardingCompleted: (onboardingCompleted) =>
        set({ onboardingCompleted }),
      setDailyGoal: (dailyGoal) => set({ dailyGoal }),
    }),
    {
      name: "settings-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
