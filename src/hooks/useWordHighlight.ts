import { useState, useEffect, useCallback, useRef } from "react";
import {
  loadSurahWordData,
  SurahWordData,
  WordData,
  findCurrentWordIndex,
  getVerseWords,
} from "../services/wordTimingService";

interface UseWordHighlightProps {
  surahId: number;
  currentVerseKey: string | null;
  playbackPositionMs: number;
  isPlaying: boolean;
}

interface WordHighlightState {
  isLoading: boolean;
  surahData: SurahWordData | null;
  currentVerseWords: WordData[];
  currentWordIndex: number;
  currentWord: WordData | null;
  error: string | null;
}

export function useWordHighlight({
  surahId,
  currentVerseKey,
  playbackPositionMs,
  isPlaying,
}: UseWordHighlightProps) {
  const [state, setState] = useState<WordHighlightState>({
    isLoading: false,
    surahData: null,
    currentVerseWords: [],
    currentWordIndex: -1,
    currentWord: null,
    error: null,
  });

  const prevVerseKeyRef = useRef<string | null>(null);

  // Load surah word data
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const data = await loadSurahWordData(surahId);

        if (mounted) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            surahData: data,
            error: data ? null : "Kelime verisi yuklenemedi",
          }));
        }
      } catch (error) {
        if (mounted) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: "Kelime verisi yuklenemedi",
          }));
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [surahId]);

  // Update current verse words when verse changes
  useEffect(() => {
    if (!state.surahData || !currentVerseKey) {
      setState(prev => ({
        ...prev,
        currentVerseWords: [],
        currentWordIndex: -1,
        currentWord: null,
      }));
      return;
    }

    // Only update if verse key changed
    if (currentVerseKey === prevVerseKeyRef.current) {
      return;
    }

    prevVerseKeyRef.current = currentVerseKey;

    // Parse verse key (e.g., "1:2" -> surah 1, verse 2)
    const [_, verseNum] = currentVerseKey.split(":").map(Number);
    const words = getVerseWords(state.surahData, verseNum);

    setState(prev => ({
      ...prev,
      currentVerseWords: words,
      currentWordIndex: -1,
      currentWord: null,
    }));
  }, [state.surahData, currentVerseKey]);

  // Update current word based on playback position
  useEffect(() => {
    if (!isPlaying || state.currentVerseWords.length === 0) {
      return;
    }

    const wordIndex = findCurrentWordIndex(state.currentVerseWords, playbackPositionMs);

    if (wordIndex !== state.currentWordIndex) {
      setState(prev => ({
        ...prev,
        currentWordIndex: wordIndex,
        currentWord: wordIndex >= 0 ? prev.currentVerseWords[wordIndex] : null,
      }));
    }
  }, [playbackPositionMs, isPlaying, state.currentVerseWords, state.currentWordIndex]);

  // Get words for a specific verse
  const getWordsForVerse = useCallback(
    (verseNumber: number): WordData[] => {
      if (!state.surahData) return [];
      return getVerseWords(state.surahData, verseNumber);
    },
    [state.surahData]
  );

  // Reset state
  const reset = useCallback(() => {
    prevVerseKeyRef.current = null;
    setState(prev => ({
      ...prev,
      currentVerseWords: [],
      currentWordIndex: -1,
      currentWord: null,
    }));
  }, []);

  return {
    ...state,
    getWordsForVerse,
    reset,
  };
}
