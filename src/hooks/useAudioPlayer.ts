import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchVerseAudioUrls,
  playVerseAudio,
  stopAudio,
  pauseAudio,
  resumeAudio,
  configureAudio,
  ReciterId,
  RECITERS,
  PlaybackStatus,
} from "../services/audioService";

interface UseAudioPlayerProps {
  chapterId: number;
  reciterId?: ReciterId;
}

interface AudioPlayerState {
  isLoading: boolean;
  isPlaying: boolean;
  currentVerseKey: string | null;
  progress: number;
  duration: number;
  error: string | null;
}

export function useAudioPlayer({ chapterId, reciterId = 7 }: UseAudioPlayerProps) {
  const [audioUrls, setAudioUrls] = useState<Map<string, string>>(new Map());
  const [state, setState] = useState<AudioPlayerState>({
    isLoading: false,
    isPlaying: false,
    currentVerseKey: null,
    progress: 0,
    duration: 0,
    error: null,
  });

  const versesQueueRef = useRef<string[]>([]);
  const currentIndexRef = useRef<number>(-1);
  const audioUrlsRef = useRef<Map<string, string>>(new Map());
  const handlePlaybackStatusRef = useRef<((status: PlaybackStatus) => void) | null>(null);

  // Load audio URLs when chapter changes
  useEffect(() => {
    let mounted = true;

    async function loadAudioUrls() {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        await configureAudio();
        const urls = await fetchVerseAudioUrls(chapterId, reciterId);

        if (mounted) {
          setAudioUrls(urls);
          audioUrlsRef.current = urls;
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        if (mounted) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: "Ses dosyalari yuklenemedi",
          }));
        }
      }
    }

    loadAudioUrls();

    return () => {
      mounted = false;
      stopAudio();
    };
  }, [chapterId, reciterId]);

  // Handle playback status updates
  const handlePlaybackStatus = useCallback((status: PlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        setState((prev) => ({ ...prev, error: status.error || null, isPlaying: false }));
      }
      return;
    }

    setState((prev) => ({
      ...prev,
      isPlaying: status.isPlaying,
      progress: status.positionMillis,
      duration: status.durationMillis || 0,
    }));

    // Auto-play next verse when current finishes
    if (status.didJustFinish) {
      const nextIndex = currentIndexRef.current + 1;
      console.log("Verse finished, next index:", nextIndex, "queue length:", versesQueueRef.current.length);

      if (nextIndex < versesQueueRef.current.length) {
        const nextVerseKey = versesQueueRef.current[nextIndex];
        const audioUrl = audioUrlsRef.current.get(nextVerseKey);

        console.log("Auto-playing next verse:", nextVerseKey, "URL:", audioUrl);

        if (audioUrl) {
          currentIndexRef.current = nextIndex;
          setState((prev) => ({
            ...prev,
            currentVerseKey: nextVerseKey,
            isLoading: true,
          }));

          // Use setTimeout to avoid calling during state update
          setTimeout(async () => {
            try {
              await playVerseAudio(audioUrl, nextVerseKey, handlePlaybackStatusRef.current || undefined);
              setState((prev) => ({ ...prev, isLoading: false, isPlaying: true }));
            } catch (error) {
              console.error("Error auto-playing next verse:", error);
              setState((prev) => ({ ...prev, isLoading: false, isPlaying: false }));
            }
          }, 50);
        }
      } else {
        console.log("Surah finished, no more verses");
        setState((prev) => ({
          ...prev,
          isPlaying: false,
          currentVerseKey: null,
        }));
      }
    }
  }, []);

  // Keep ref updated with latest callback
  useEffect(() => {
    handlePlaybackStatusRef.current = handlePlaybackStatus;
  }, [handlePlaybackStatus]);

  // Internal play function to avoid circular dependency
  const playVerseInternal = useCallback(
    async (verseKey: string, queue?: string[]) => {
      const audioUrl = audioUrlsRef.current.get(verseKey);
      if (!audioUrl) {
        console.error("Audio URL not found for verse:", verseKey);
        setState((prev) => ({ ...prev, error: "Ses dosyasi bulunamadi" }));
        return;
      }

      // Update queue if provided
      if (queue) {
        versesQueueRef.current = queue;
        currentIndexRef.current = queue.indexOf(verseKey);
      } else {
        currentIndexRef.current = versesQueueRef.current.indexOf(verseKey);
      }

      setState((prev) => ({
        ...prev,
        isLoading: true,
        currentVerseKey: verseKey,
        error: null,
      }));

      try {
        await playVerseAudio(audioUrl, verseKey, handlePlaybackStatusRef.current || undefined);
        setState((prev) => ({ ...prev, isLoading: false, isPlaying: true }));
      } catch (error) {
        console.error("Error playing verse:", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isPlaying: false,
          error: "Ses calinamadi",
        }));
      }
    },
    []
  );

  // Play a specific verse
  const playVerse = useCallback(
    (verseKey: string, queue?: string[]) => {
      playVerseInternal(verseKey, queue);
    },
    [playVerseInternal]
  );

  // Play all verses from a specific verse
  const playFromVerse = useCallback(
    (verseKey: string, allVerseKeys: string[]) => {
      const startIndex = allVerseKeys.indexOf(verseKey);
      if (startIndex === -1) return;

      const queue = allVerseKeys.slice(startIndex);
      playVerse(verseKey, queue);
    },
    [playVerse]
  );

  // Toggle play/pause
  const togglePlayPause = useCallback(async () => {
    if (state.isPlaying) {
      await pauseAudio();
      setState((prev) => ({ ...prev, isPlaying: false }));
    } else if (state.currentVerseKey) {
      await resumeAudio();
      setState((prev) => ({ ...prev, isPlaying: true }));
    }
  }, [state.isPlaying, state.currentVerseKey]);

  // Stop playback
  const stop = useCallback(async () => {
    await stopAudio();
    versesQueueRef.current = [];
    currentIndexRef.current = -1;
    setState((prev) => ({
      ...prev,
      isPlaying: false,
      currentVerseKey: null,
      progress: 0,
    }));
  }, []);

  // Play next verse
  const playNext = useCallback(() => {
    const nextIndex = currentIndexRef.current + 1;
    if (nextIndex < versesQueueRef.current.length) {
      const nextVerseKey = versesQueueRef.current[nextIndex];
      playVerse(nextVerseKey);
    }
  }, [playVerse]);

  // Play previous verse
  const playPrevious = useCallback(() => {
    const prevIndex = currentIndexRef.current - 1;
    if (prevIndex >= 0) {
      const prevVerseKey = versesQueueRef.current[prevIndex];
      playVerse(prevVerseKey);
    }
  }, [playVerse]);

  return {
    ...state,
    audioUrls,
    reciters: RECITERS,
    playVerse,
    playFromVerse,
    togglePlayPause,
    stop,
    playNext,
    playPrevious,
    hasNext: currentIndexRef.current < versesQueueRef.current.length - 1,
    hasPrevious: currentIndexRef.current > 0,
  };
}
