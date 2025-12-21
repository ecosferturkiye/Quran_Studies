// Word Timing Service - Load and manage word-level timing data

export interface WordData {
  wordRank: number;
  arabic: string;
  tanzilClean: string;
  root: string;
  rootArabic: string;
  startTime: number;
  endTime: number;
  level1: number | null;
  level2: number | null;
  level3: number | null;
  level4: number | null;
  translations: {
    en: string;
    tr: string;
    ur: string;
    hi: string;
    id: string;
    bn: string;
    ru: string;
  };
}

export interface VerseWordData {
  verseNumber: number;
  verseKey: string;
  wordCount: number;
  words: WordData[];
}

export interface SurahWordData {
  surahId: number;
  surahArabic: string;
  surahLatin: string;
  verses: VerseWordData[];
}

// Cache for loaded surah data
const surahCache = new Map<number, SurahWordData>();

// Dynamic import map for all 114 surahs
const surahImportMap: Record<number, () => Promise<{ default: SurahWordData }>> = {
  1: () => import("../data/quran-master/surah-001.json"),
  2: () => import("../data/quran-master/surah-002.json"),
  3: () => import("../data/quran-master/surah-003.json"),
  4: () => import("../data/quran-master/surah-004.json"),
  5: () => import("../data/quran-master/surah-005.json"),
  6: () => import("../data/quran-master/surah-006.json"),
  7: () => import("../data/quran-master/surah-007.json"),
  8: () => import("../data/quran-master/surah-008.json"),
  9: () => import("../data/quran-master/surah-009.json"),
  10: () => import("../data/quran-master/surah-010.json"),
  11: () => import("../data/quran-master/surah-011.json"),
  12: () => import("../data/quran-master/surah-012.json"),
  13: () => import("../data/quran-master/surah-013.json"),
  14: () => import("../data/quran-master/surah-014.json"),
  15: () => import("../data/quran-master/surah-015.json"),
  16: () => import("../data/quran-master/surah-016.json"),
  17: () => import("../data/quran-master/surah-017.json"),
  18: () => import("../data/quran-master/surah-018.json"),
  19: () => import("../data/quran-master/surah-019.json"),
  20: () => import("../data/quran-master/surah-020.json"),
  21: () => import("../data/quran-master/surah-021.json"),
  22: () => import("../data/quran-master/surah-022.json"),
  23: () => import("../data/quran-master/surah-023.json"),
  24: () => import("../data/quran-master/surah-024.json"),
  25: () => import("../data/quran-master/surah-025.json"),
  26: () => import("../data/quran-master/surah-026.json"),
  27: () => import("../data/quran-master/surah-027.json"),
  28: () => import("../data/quran-master/surah-028.json"),
  29: () => import("../data/quran-master/surah-029.json"),
  30: () => import("../data/quran-master/surah-030.json"),
  31: () => import("../data/quran-master/surah-031.json"),
  32: () => import("../data/quran-master/surah-032.json"),
  33: () => import("../data/quran-master/surah-033.json"),
  34: () => import("../data/quran-master/surah-034.json"),
  35: () => import("../data/quran-master/surah-035.json"),
  36: () => import("../data/quran-master/surah-036.json"),
  37: () => import("../data/quran-master/surah-037.json"),
  38: () => import("../data/quran-master/surah-038.json"),
  39: () => import("../data/quran-master/surah-039.json"),
  40: () => import("../data/quran-master/surah-040.json"),
  41: () => import("../data/quran-master/surah-041.json"),
  42: () => import("../data/quran-master/surah-042.json"),
  43: () => import("../data/quran-master/surah-043.json"),
  44: () => import("../data/quran-master/surah-044.json"),
  45: () => import("../data/quran-master/surah-045.json"),
  46: () => import("../data/quran-master/surah-046.json"),
  47: () => import("../data/quran-master/surah-047.json"),
  48: () => import("../data/quran-master/surah-048.json"),
  49: () => import("../data/quran-master/surah-049.json"),
  50: () => import("../data/quran-master/surah-050.json"),
  51: () => import("../data/quran-master/surah-051.json"),
  52: () => import("../data/quran-master/surah-052.json"),
  53: () => import("../data/quran-master/surah-053.json"),
  54: () => import("../data/quran-master/surah-054.json"),
  55: () => import("../data/quran-master/surah-055.json"),
  56: () => import("../data/quran-master/surah-056.json"),
  57: () => import("../data/quran-master/surah-057.json"),
  58: () => import("../data/quran-master/surah-058.json"),
  59: () => import("../data/quran-master/surah-059.json"),
  60: () => import("../data/quran-master/surah-060.json"),
  61: () => import("../data/quran-master/surah-061.json"),
  62: () => import("../data/quran-master/surah-062.json"),
  63: () => import("../data/quran-master/surah-063.json"),
  64: () => import("../data/quran-master/surah-064.json"),
  65: () => import("../data/quran-master/surah-065.json"),
  66: () => import("../data/quran-master/surah-066.json"),
  67: () => import("../data/quran-master/surah-067.json"),
  68: () => import("../data/quran-master/surah-068.json"),
  69: () => import("../data/quran-master/surah-069.json"),
  70: () => import("../data/quran-master/surah-070.json"),
  71: () => import("../data/quran-master/surah-071.json"),
  72: () => import("../data/quran-master/surah-072.json"),
  73: () => import("../data/quran-master/surah-073.json"),
  74: () => import("../data/quran-master/surah-074.json"),
  75: () => import("../data/quran-master/surah-075.json"),
  76: () => import("../data/quran-master/surah-076.json"),
  77: () => import("../data/quran-master/surah-077.json"),
  78: () => import("../data/quran-master/surah-078.json"),
  79: () => import("../data/quran-master/surah-079.json"),
  80: () => import("../data/quran-master/surah-080.json"),
  81: () => import("../data/quran-master/surah-081.json"),
  82: () => import("../data/quran-master/surah-082.json"),
  83: () => import("../data/quran-master/surah-083.json"),
  84: () => import("../data/quran-master/surah-084.json"),
  85: () => import("../data/quran-master/surah-085.json"),
  86: () => import("../data/quran-master/surah-086.json"),
  87: () => import("../data/quran-master/surah-087.json"),
  88: () => import("../data/quran-master/surah-088.json"),
  89: () => import("../data/quran-master/surah-089.json"),
  90: () => import("../data/quran-master/surah-090.json"),
  91: () => import("../data/quran-master/surah-091.json"),
  92: () => import("../data/quran-master/surah-092.json"),
  93: () => import("../data/quran-master/surah-093.json"),
  94: () => import("../data/quran-master/surah-094.json"),
  95: () => import("../data/quran-master/surah-095.json"),
  96: () => import("../data/quran-master/surah-096.json"),
  97: () => import("../data/quran-master/surah-097.json"),
  98: () => import("../data/quran-master/surah-098.json"),
  99: () => import("../data/quran-master/surah-099.json"),
  100: () => import("../data/quran-master/surah-100.json"),
  101: () => import("../data/quran-master/surah-101.json"),
  102: () => import("../data/quran-master/surah-102.json"),
  103: () => import("../data/quran-master/surah-103.json"),
  104: () => import("../data/quran-master/surah-104.json"),
  105: () => import("../data/quran-master/surah-105.json"),
  106: () => import("../data/quran-master/surah-106.json"),
  107: () => import("../data/quran-master/surah-107.json"),
  108: () => import("../data/quran-master/surah-108.json"),
  109: () => import("../data/quran-master/surah-109.json"),
  110: () => import("../data/quran-master/surah-110.json"),
  111: () => import("../data/quran-master/surah-111.json"),
  112: () => import("../data/quran-master/surah-112.json"),
  113: () => import("../data/quran-master/surah-113.json"),
  114: () => import("../data/quran-master/surah-114.json"),
};

// Load surah word data (dynamic import with caching)
export async function loadSurahWordData(surahId: number): Promise<SurahWordData | null> {
  // Check cache first
  if (surahCache.has(surahId)) {
    return surahCache.get(surahId)!;
  }

  // Check if surah exists in import map
  const importFn = surahImportMap[surahId];
  if (!importFn) {
    console.log(`Invalid surah ID: ${surahId}`);
    return null;
  }

  try {
    const module = await importFn();
    const data = module.default as SurahWordData;
    surahCache.set(surahId, data);
    console.log(`Loaded word data for surah ${surahId}`);
    return data;
  } catch (error) {
    console.error(`Error loading word data for surah ${surahId}:`, error);
    return null;
  }
}

// Get words for a specific verse
export function getVerseWords(surahData: SurahWordData, verseNumber: number): WordData[] {
  const verse = surahData.verses.find(v => v.verseNumber === verseNumber);
  return verse?.words || [];
}

// Find current word based on playback position
export function findCurrentWord(
  words: WordData[],
  positionMs: number
): WordData | null {
  for (const word of words) {
    if (positionMs >= word.startTime && positionMs < word.endTime) {
      return word;
    }
  }
  return null;
}

// Find current word index based on playback position
export function findCurrentWordIndex(
  words: WordData[],
  positionMs: number
): number {
  for (let i = 0; i < words.length; i++) {
    if (positionMs >= words[i].startTime && positionMs < words[i].endTime) {
      return i;
    }
  }
  return -1;
}

// Get word color based on level
export function getWordLevelColor(word: WordData, level: number): string | null {
  switch (level) {
    case 1:
      return word.level1 ? '#4CAF50' : null; // Green for level 1
    case 2:
      return word.level2 ? '#2196F3' : null; // Blue for level 2
    case 3:
      return word.level3 ? '#9C27B0' : null; // Purple for level 3
    case 4:
      return word.level4 ? '#FF9800' : null; // Orange for level 4 (roots)
    default:
      return null;
  }
}

// Clear cache
export function clearWordTimingCache(): void {
  surahCache.clear();
}
