import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type TefsirSource = "elmalili" | "studyquran" | "kuranyolu" | "hayrat";

interface TefsirProgress {
  surahId: number;
  source: TefsirSource;
  scrollPosition: number;  // Scroll Y pozisyonu
  paragraphIndex: number;  // Kalınan paragraf indeksi
  timestamp: number;
}

// Key format: "elmalili:1" (source:surahId)
type ProgressKey = string;

interface TefsirState {
  // Her sure için ayrı progress kaydı: "source:surahId" -> progress
  progressMap: Record<ProgressKey, TefsirProgress>;

  // Tercih edilen tefsir kaynağı
  preferredSource: TefsirSource;

  // Actions
  saveProgress: (source: TefsirSource, surahId: number, scrollPosition: number, paragraphIndex: number) => void;
  getProgress: (source: TefsirSource, surahId: number) => TefsirProgress | null;
  setPreferredSource: (source: TefsirSource) => void;
  clearProgress: (source: TefsirSource, surahId: number) => void;
  clearAllProgress: () => void;
  // Son okunan sureleri getir (sure listesinde işaretlemek için)
  getProgressForSource: (source: TefsirSource) => TefsirProgress[];
}

export const useTefsirStore = create<TefsirState>()(
  persist(
    (set, get) => ({
      // Initial state
      progressMap: {},
      preferredSource: "elmalili",

      // Actions
      saveProgress: (source, surahId, scrollPosition, paragraphIndex) => {
        const key = `${source}:${surahId}`;
        set((state) => ({
          progressMap: {
            ...state.progressMap,
            [key]: {
              surahId,
              source,
              scrollPosition,
              paragraphIndex,
              timestamp: Date.now(),
            },
          },
        }));
      },

      getProgress: (source, surahId) => {
        const key = `${source}:${surahId}`;
        return get().progressMap[key] || null;
      },

      setPreferredSource: (source) => set({ preferredSource: source }),

      clearProgress: (source, surahId) => {
        const key = `${source}:${surahId}`;
        set((state) => {
          const newMap = { ...state.progressMap };
          delete newMap[key];
          return { progressMap: newMap };
        });
      },

      clearAllProgress: () => set({ progressMap: {} }),

      getProgressForSource: (source) => {
        const map = get().progressMap;
        return Object.entries(map)
          .filter(([key]) => key.startsWith(`${source}:`))
          .map(([, progress]) => progress);
      },
    }),
    {
      name: "tefsir-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
