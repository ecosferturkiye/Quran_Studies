// Learning Module Types

export type SupportedLanguage = "en" | "tr" | "ur" | "hi" | "id" | "bn" | "ru";

export type LearningCategory = "words" | "twogram" | "threegram";

export interface VocabularyWord {
  id: string;
  arabic: string;
  frequency: number;
  translations: Record<SupportedLanguage, string>;
}

export interface Phrase {
  id: string;
  arabic: string;
  frequency: number;
  wordCount: 2 | 3;
  translations: Record<SupportedLanguage, string>;
}

export type LearningItem = VocabularyWord | Phrase;

// Spaced Repetition (SM-2 Algorithm)
export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

export type MasteryLevel = "new" | "learning" | "reviewing" | "mastered";

export interface CardProgress {
  id: string;
  category: LearningCategory;
  repetitions: number;
  easeFactor: number;
  interval: number;
  nextReviewDate: string;
  lastReviewDate: string;
  masteryLevel: MasteryLevel;
}

export type UserRating = "again" | "hard" | "good" | "easy";

export interface FlashcardSession {
  category: LearningCategory;
  cards: string[]; // Card IDs
  currentIndex: number;
  correctCount: number;
  incorrectCount: number;
  startTime: number;
}

export interface LearningStats {
  totalCards: number;
  masteredCards: number;
  learningCards: number;
  newCards: number;
  reviewingCards: number;
  streak: number;
  lastStudyDate: string | null;
  todayReviewed: number;
  dailyGoal: number;
}

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: "English",
  tr: "Türkçe",
  ur: "اردو",
  hi: "हिन्दी",
  id: "Indonesia",
  bn: "বাংলা",
  ru: "Русский",
};
