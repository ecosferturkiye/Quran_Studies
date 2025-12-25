// Local Quran data service - uses downloaded JSON files
// Data source: Tanzil.net via quran-json (https://github.com/risan/quran-json)

import quranArabic from "../data/quran/quran_arabic.json";
import quranTurkish from "../data/quran/quran_turkish.json";
import quranEnglish from "../data/quran/quran_english.json";
import quranHaleem from "../data/quran/quran_haleem.json";
import quranClearQuran from "../data/quran/quran_clearquran.json";
import quranStudyQuran from "../data/quran/quran_studyquran.json";
import studyQuranCommentary from "../data/quran/studyquran_commentary.json";
import kuranYoluCommentary from "../data/quran/kuranyolu_commentary.json";
import diyanetRanges from "../data/quran/diyanet_ranges.json";
import hayratMeal from "../data/quran/hayrat_meal.json";

// Haleem, Clear Quran, Study Quran format: { "surahId": { "verseId": "text" } }
const haleemData = quranHaleem as Record<string, Record<string, string>>;
const clearQuranData = quranClearQuran as Record<string, Record<string, string>>;
const studyQuranData = quranStudyQuran as Record<string, Record<string, string>>;

// Study Quran Commentary format: { "commentary": { "surah:verse": "text" } }
const commentaryData = (studyQuranCommentary as { commentary: Record<string, string> }).commentary;

// Kur'an Yolu Commentary format: { "commentary": { "surah:verse": "text" } }
// Keys can be single verses like "2:14" or ranges like "2:14-16"
const kuranYoluData = (kuranYoluCommentary as { commentary: Record<string, string> }).commentary;

// Hayrat Meal format: { "translations": { "surah:verse": "text" }, "tafsir": { "surah:verse": "text" } }
const hayratData = hayratMeal as {
  translations: Record<string, string>;
  tafsir: Record<string, string>;
};

// Diyanet ranges format: { "ranges": { "surahId:start-end": { surahId, startVerse, endVerse, verseCount } } }
// These are verses where the translator combined multiple Arabic verses into one Turkish translation
interface DiyanetRange {
  surahId: number;
  startVerse: number;
  endVerse: number;
  verseCount: number;
}
const diyanetRangesData = (diyanetRanges as { ranges: Record<string, DiyanetRange> }).ranges;

// Helper function to find Diyanet range for a verse
function findDiyanetRange(surahId: number, verseNum: number): {
  rangeKey: string;
  startVerse: number;
  endVerse: number;
} | null {
  // Search for range keys that include this verse
  for (const [key, range] of Object.entries(diyanetRangesData)) {
    if (range.surahId === surahId && verseNum >= range.startVerse && verseNum <= range.endVerse) {
      return {
        rangeKey: key,
        startVerse: range.startVerse,
        endVerse: range.endVerse,
      };
    }
  }
  return null;
}

// Helper function to find Kur'an Yolu commentary for a verse
// Returns { text, rangeKey, startVerse, endVerse } or null
function findKuranYoluCommentary(surahId: number, verseNum: number): {
  text: string;
  rangeKey: string;
  startVerse: number;
  endVerse: number;
} | null {
  // First try exact match
  const exactKey = `${surahId}:${verseNum}`;
  if (kuranYoluData[exactKey]) {
    return {
      text: kuranYoluData[exactKey],
      rangeKey: exactKey,
      startVerse: verseNum,
      endVerse: verseNum,
    };
  }

  // Search for range keys that include this verse
  for (const key of Object.keys(kuranYoluData)) {
    if (!key.startsWith(`${surahId}:`)) continue;

    const versePart = key.split(":")[1];
    if (versePart.includes("-")) {
      const [start, end] = versePart.split("-").map(Number);
      if (verseNum >= start && verseNum <= end) {
        return {
          text: kuranYoluData[key],
          rangeKey: key,
          startVerse: start,
          endVerse: end,
        };
      }
    }
  }

  return null;
}

export interface LocalVerse {
  id: number;
  verseNumber: number;
  verseKey: string;
  textArabic: string;
  translationTurkish: string;
  translationEnglish: string;
  translationHaleem: string;
  translationClearQuran: string;
  translationStudyQuran: string;
  translationHayrat: string;
  commentaryStudyQuran: string;
  commentaryKuranYolu: string;
  commentaryHayrat: string;
  // Kur'an Yolu tefsir range info (for grouped verses)
  kuranYoluRangeKey?: string;
  kuranYoluStartVerse?: number;
  kuranYoluEndVerse?: number;
  // Diyanet translation range info (for combined verse translations)
  diyanetRangeKey?: string;
  diyanetStartVerse?: number;
  diyanetEndVerse?: number;
}

export interface LocalSurah {
  id: number;
  nameArabic: string;
  nameTransliteration: string;
  nameTurkish: string;
  type: "meccan" | "medinan";
  totalVerses: number;
  verses: LocalVerse[];
}

interface QuranJsonSurah {
  id: number;
  name: string;
  transliteration: string;
  translation: string;
  type: string;
  total_verses: number;
  verses: Array<{
    id: number;
    text: string;
    translation?: string;
  }>;
}

const arabicData = quranArabic as QuranJsonSurah[];
const turkishData = quranTurkish as QuranJsonSurah[];
const englishData = quranEnglish as QuranJsonSurah[];

export function getLocalSurah(surahId: number): LocalSurah | null {
  const arabicSurah = arabicData.find((s) => s.id === surahId);
  const turkishSurah = turkishData.find((s) => s.id === surahId);
  const englishSurah = englishData.find((s) => s.id === surahId);
  const haleemSurah = haleemData[String(surahId)] || {};
  const clearQuranSurah = clearQuranData[String(surahId)] || {};
  const studyQuranSurah = studyQuranData[String(surahId)] || {};

  if (!arabicSurah) return null;

  const verses: LocalVerse[] = arabicSurah.verses.map((verse, index) => {
    const verseKey = `${surahId}:${verse.id}`;
    const kuranYolu = findKuranYoluCommentary(surahId, verse.id);
    const diyanetRange = findDiyanetRange(surahId, verse.id);

    return {
      id: verse.id,
      verseNumber: verse.id,
      verseKey,
      textArabic: verse.text,
      translationTurkish: turkishSurah?.verses[index]?.translation || "",
      translationEnglish: englishSurah?.verses[index]?.translation || "",
      translationHaleem: haleemSurah[String(verse.id)] || "",
      translationClearQuran: clearQuranSurah[String(verse.id)] || "",
      translationStudyQuran: studyQuranSurah[String(verse.id)] || "",
      translationHayrat: hayratData.translations[verseKey] || "",
      commentaryStudyQuran: commentaryData[verseKey] || "",
      commentaryKuranYolu: kuranYolu?.text || "",
      commentaryHayrat: hayratData.tafsir[verseKey] || "",
      kuranYoluRangeKey: kuranYolu?.rangeKey,
      kuranYoluStartVerse: kuranYolu?.startVerse,
      kuranYoluEndVerse: kuranYolu?.endVerse,
      diyanetRangeKey: diyanetRange?.rangeKey,
      diyanetStartVerse: diyanetRange?.startVerse,
      diyanetEndVerse: diyanetRange?.endVerse,
    };
  });

  return {
    id: surahId,
    nameArabic: arabicSurah.name,
    nameTransliteration: arabicSurah.transliteration,
    nameTurkish: turkishSurah?.translation || arabicSurah.transliteration,
    type: arabicSurah.type === "meccan" ? "meccan" : "medinan",
    totalVerses: arabicSurah.total_verses,
    verses,
  };
}

export function getLocalVersesByChapter(chapterId: number): LocalVerse[] {
  const surah = getLocalSurah(chapterId);
  return surah?.verses || [];
}

export function getAllSurahs(): Array<{
  id: number;
  nameArabic: string;
  nameTransliteration: string;
  nameTurkish: string;
  type: string;
  totalVerses: number;
}> {
  return arabicData.map((surah) => {
    const turkishSurah = turkishData.find((s) => s.id === surah.id);
    return {
      id: surah.id,
      nameArabic: surah.name,
      nameTransliteration: surah.transliteration,
      nameTurkish: turkishSurah?.translation || surah.transliteration,
      type: surah.type,
      totalVerses: surah.total_verses,
    };
  });
}
