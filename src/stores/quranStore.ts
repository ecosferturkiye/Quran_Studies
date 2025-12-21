import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Bookmark, LastPlayed } from "../types";

interface QuranState {
  // Current Position
  currentPage: number;
  currentAyah: { surah: number; ayah: number } | null;

  // History
  lastPlayed: LastPlayed | null;
  readingHistory: number[]; // Pages visited

  // Bookmarks
  bookmarks: Bookmark[];

  // Downloaded Content
  downloadedJuz: number[];
  downloadedSurahs: number[];

  // Actions
  setCurrentPage: (page: number) => void;
  setCurrentAyah: (surah: number, ayah: number) => void;
  updateLastPlayed: (page: number, surah: number, ayah: number) => void;
  addToHistory: (page: number) => void;
  addBookmark: (bookmark: Omit<Bookmark, "id" | "timestamp">) => void;
  removeBookmark: (id: string) => void;
  clearBookmarks: () => void;
  addDownloadedJuz: (juz: number) => void;
  removeDownloadedJuz: (juz: number) => void;
  addDownloadedSurah: (surah: number) => void;
  removeDownloadedSurah: (surah: number) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useQuranStore = create<QuranState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentPage: 1,
      currentAyah: null,
      lastPlayed: null,
      readingHistory: [],
      bookmarks: [],
      downloadedJuz: [],
      downloadedSurahs: [],

      // Actions
      setCurrentPage: (page) => set({ currentPage: page }),

      setCurrentAyah: (surah, ayah) =>
        set({ currentAyah: { surah, ayah } }),

      updateLastPlayed: (page, surah, ayah) =>
        set({
          lastPlayed: { page, surah, ayah, timestamp: Date.now() },
        }),

      addToHistory: (page) => {
        const history = get().readingHistory;
        const filtered = history.filter((p) => p !== page);
        const newHistory = [page, ...filtered].slice(0, 50); // Keep last 50
        set({ readingHistory: newHistory });
      },

      addBookmark: (bookmarkData) => {
        const bookmark: Bookmark = {
          ...bookmarkData,
          id: generateId(),
          timestamp: Date.now(),
        };
        set((state) => ({
          bookmarks: [...state.bookmarks, bookmark],
        }));
      },

      removeBookmark: (id) =>
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.id !== id),
        })),

      clearBookmarks: () => set({ bookmarks: [] }),

      addDownloadedJuz: (juz) =>
        set((state) => ({
          downloadedJuz: [...new Set([...state.downloadedJuz, juz])],
        })),

      removeDownloadedJuz: (juz) =>
        set((state) => ({
          downloadedJuz: state.downloadedJuz.filter((j) => j !== juz),
        })),

      addDownloadedSurah: (surah) =>
        set((state) => ({
          downloadedSurahs: [...new Set([...state.downloadedSurahs, surah])],
        })),

      removeDownloadedSurah: (surah) =>
        set((state) => ({
          downloadedSurahs: state.downloadedSurahs.filter((s) => s !== surah),
        })),
    }),
    {
      name: "quran-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
