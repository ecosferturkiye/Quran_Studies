import { Platform } from "react-native";

const QURAN_API_BASE = "https://api.quran.com/api/v4";
const AUDIO_CDN_BASE = "https://verses.quran.com";

// Popular reciters
export const RECITERS = [
  { id: 7, name: "Mishari Rashid al-Afasy", style: "murattal" },
  { id: 1, name: "AbdulBaset AbdulSamad (Mujawwad)", style: "mujawwad" },
  { id: 2, name: "AbdulBaset AbdulSamad (Murattal)", style: "murattal" },
  { id: 3, name: "Abdur-Rahman as-Sudais", style: "murattal" },
  { id: 6, name: "Mahmoud Khalil Al-Husary", style: "murattal" },
  { id: 4, name: "Abu Bakr al-Shatri", style: "murattal" },
] as const;

export type ReciterId = (typeof RECITERS)[number]["id"];

interface AudioFile {
  url: string;
  verseKey: string;
}

interface ChapterAudio {
  audioUrl: string;
  fileSize: number;
}

// Playback status interface
export interface PlaybackStatus {
  isLoaded: boolean;
  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
  didJustFinish: boolean;
  error?: string;
}

// Current state
let currentVerseKey: string | null = null;
let webAudio: HTMLAudioElement | null = null;
let statusCallback: ((status: PlaybackStatus) => void) | null = null;
let progressInterval: ReturnType<typeof setInterval> | null = null;

// Configure audio for background playback
export async function configureAudio() {
  // No special configuration needed for web
  console.log("Audio configured for platform:", Platform.OS);
}

// Fetch verse audio URLs for a chapter
export async function fetchVerseAudioUrls(
  chapterId: number,
  reciterId: ReciterId = 7
): Promise<Map<string, string>> {
  const audioMap = new Map<string, string>();

  try {
    const response = await fetch(
      `${QURAN_API_BASE}/recitations/${reciterId}/by_chapter/${chapterId}`
    );
    const data = await response.json();
    const audioFiles: { verse_key: string; url: string }[] = data.audio_files || [];

    audioFiles.forEach((file) => {
      audioMap.set(file.verse_key, `${AUDIO_CDN_BASE}/${file.url}`);
    });

    console.log(`Loaded ${audioMap.size} audio URLs for chapter ${chapterId}`);
  } catch (error) {
    console.error("Error fetching verse audio:", error);
  }

  return audioMap;
}

// Fetch full chapter audio URL
export async function fetchChapterAudio(
  chapterId: number,
  reciterId: ReciterId = 7
): Promise<ChapterAudio | null> {
  try {
    const response = await fetch(
      `${QURAN_API_BASE}/chapter_recitations/${reciterId}/${chapterId}`
    );
    const data = await response.json();

    if (data.audio_file) {
      return {
        audioUrl: data.audio_file.audio_url,
        fileSize: data.audio_file.file_size,
      };
    }
  } catch (error) {
    console.error("Error fetching chapter audio:", error);
  }

  return null;
}

// Play a verse audio
export async function playVerseAudio(
  audioUrl: string,
  verseKey: string,
  onPlaybackStatusUpdate?: (status: PlaybackStatus) => void
): Promise<void> {
  console.log("playVerseAudio called:", { audioUrl, verseKey });

  try {
    // Stop current audio if playing (use internal to preserve callback for auto-play)
    stopAudioInternal();

    statusCallback = onPlaybackStatusUpdate || null;
    currentVerseKey = verseKey;

    // Use HTML5 Audio for all platforms (simpler and works everywhere)
    webAudio = new Audio(audioUrl);

    webAudio.onloadedmetadata = () => {
      console.log("Audio metadata loaded, duration:", webAudio?.duration);
      if (statusCallback && webAudio) {
        statusCallback({
          isLoaded: true,
          isPlaying: false,
          positionMillis: 0,
          durationMillis: (webAudio.duration || 0) * 1000,
          didJustFinish: false,
        });
      }
    };

    webAudio.onplay = () => {
      console.log("Audio started playing");
      if (statusCallback && webAudio) {
        statusCallback({
          isLoaded: true,
          isPlaying: true,
          positionMillis: (webAudio.currentTime || 0) * 1000,
          durationMillis: (webAudio.duration || 0) * 1000,
          didJustFinish: false,
        });
      }
    };

    webAudio.onpause = () => {
      console.log("Audio paused");
      if (statusCallback && webAudio) {
        statusCallback({
          isLoaded: true,
          isPlaying: false,
          positionMillis: (webAudio.currentTime || 0) * 1000,
          durationMillis: (webAudio.duration || 0) * 1000,
          didJustFinish: false,
        });
      }
    };

    // Use interval for word highlighting sync
    // 80ms = ~12 updates/sec (balanced between smoothness and performance)
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    progressInterval = setInterval(() => {
      if (statusCallback && webAudio && !webAudio.paused) {
        statusCallback({
          isLoaded: true,
          isPlaying: true,
          positionMillis: (webAudio.currentTime || 0) * 1000,
          durationMillis: (webAudio.duration || 0) * 1000,
          didJustFinish: false,
        });
      }
    }, 80);

    webAudio.onended = () => {
      console.log("Audio ended for verse:", verseKey);
      if (statusCallback && webAudio) {
        statusCallback({
          isLoaded: true,
          isPlaying: false,
          positionMillis: (webAudio.duration || 0) * 1000,
          durationMillis: (webAudio.duration || 0) * 1000,
          didJustFinish: true,
        });
      }
    };

    webAudio.onerror = (e) => {
      console.error("Audio error:", e);
      if (statusCallback) {
        statusCallback({
          isLoaded: false,
          isPlaying: false,
          positionMillis: 0,
          durationMillis: 0,
          didJustFinish: false,
          error: "Audio failed to load",
        });
      }
    };

    // Start playing
    await webAudio.play();
    console.log("Audio play() called successfully");
  } catch (error) {
    console.error("Error playing audio:", error);
    if (statusCallback) {
      statusCallback({
        isLoaded: false,
        isPlaying: false,
        positionMillis: 0,
        durationMillis: 0,
        didJustFinish: false,
        error: String(error),
      });
    }
  }
}

// Stop current audio (internal - preserves callback for auto-play)
function stopAudioInternal() {
  // Clear progress interval
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }

  if (webAudio) {
    try {
      webAudio.pause();
      webAudio.currentTime = 0;
      webAudio.src = "";
      webAudio = null;
      console.log("Audio stopped (internal)");
    } catch (error) {
      console.error("Error stopping audio:", error);
    }
  }
  currentVerseKey = null;
}

// Stop current audio (public - clears callback)
export async function stopAudio() {
  stopAudioInternal();
  statusCallback = null;
}

// Pause current audio
export async function pauseAudio() {
  if (webAudio) {
    try {
      webAudio.pause();
      console.log("Audio paused");
    } catch (error) {
      console.error("Error pausing audio:", error);
    }
  }
}

// Resume current audio
export async function resumeAudio() {
  if (webAudio) {
    try {
      await webAudio.play();
      console.log("Audio resumed");
    } catch (error) {
      console.error("Error resuming audio:", error);
    }
  }
}

// Get current playing verse key
export function getCurrentVerseKey(): string | null {
  return currentVerseKey;
}

// Check if audio is playing
export async function isPlaying(): Promise<boolean> {
  if (webAudio) {
    return !webAudio.paused;
  }
  return false;
}
