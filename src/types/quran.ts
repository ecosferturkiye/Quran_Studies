// Quran Data Types

export interface PageIndex {
  page: number;
  orderedAyahs: string[]; // e.g., ["001001.mp3", "001002.mp3"]
  surahs: SurahInPage[];
}

export interface SurahInPage {
  surah: number;
  "surah-latin": string;
  "ayahs-in-page": string[];
}

export interface Ayah {
  surah: number;
  ayah: number;
  surahLatin: string;
  audioFile: string;
  text?: string;
}

export interface Surah {
  number: number;
  name: string;
  nameLatin: string;
  revelationType: "meccan" | "medinan";
  ayahCount: number;
}

export interface Bookmark {
  id: string;
  page: number;
  surah: number;
  ayah: number;
  surahLatin: string;
  timestamp: number;
  note?: string;
}

export interface LastPlayed {
  page: number;
  surah: number;
  ayah: number;
  timestamp: number;
}

export type RepeatMode = "none" | "ayah" | "page" | "range";

export interface PlaybackState {
  isPlaying: boolean;
  isLoading: boolean;
  currentPage: number;
  currentAyah: { surah: number; ayah: number } | null;
  progress: number;
  duration: number;
  repeatMode: RepeatMode;
  playbackSpeed: number;
}
