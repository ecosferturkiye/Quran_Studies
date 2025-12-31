// Reading Program Types

export type ReadingType = 'meal' | 'tefsir';
export type GoalType = 'daily' | 'weekly' | 'monthly';

export interface ReadingSession {
  id: string;
  date: string;                    // "2024-12-30" format
  timestamp: number;               // Unix timestamp
  type: ReadingType;
  surahId: number;
  startVerse: number;
  endVerse: number;
  verseCount: number;
  durationMinutes?: number;        // Optional duration
  notes?: string;                  // Optional notes
}

export interface ReadingGoal {
  id: string;
  type: GoalType;
  target: number;                  // Target verse count
  readingType: ReadingType | 'all';
  createdAt: number;
  isActive: boolean;
}

export interface DailyProgress {
  date: string;
  mealVerses: number;
  tefsirVerses: number;
  totalVerses: number;
  sessions: ReadingSession[];
}

export interface ReadingStats {
  totalVerses: number;
  totalSessions: number;
  currentStreak: number;
  longestStreak: number;
  averageDaily: number;
}
