// Export all types
export * from "./quran";
export * from "./learning";

// Common types
export interface AppSettings {
  theme: "light" | "dark" | "system";
  fontSize: "small" | "medium" | "large";
  primaryLanguage: import("./learning").SupportedLanguage;
  secondaryLanguage: import("./learning").SupportedLanguage | null;
  showTranslation: boolean;
  autoAdvance: boolean;
  hapticFeedback: boolean;
}

export interface DownloadStatus {
  juzNumber?: number;
  surahNumber?: number;
  totalFiles: number;
  downloadedFiles: number;
  totalSize: number;
  downloadedSize: number;
  status: "pending" | "downloading" | "paused" | "completed" | "error";
  error?: string;
}
