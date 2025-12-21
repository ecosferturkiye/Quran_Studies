// Local Quran data service - uses downloaded JSON files
// Data source: Tanzil.net via quran-json (https://github.com/risan/quran-json)

import quranArabic from "../data/quran/quran_arabic.json";
import quranTurkish from "../data/quran/quran_turkish.json";
import quranEnglish from "../data/quran/quran_english.json";
import quranHaleem from "../data/quran/quran_haleem.json";
import quranClearQuran from "../data/quran/quran_clearquran.json";
import quranStudyQuran from "../data/quran/quran_studyquran.json";

// Haleem, Clear Quran, Study Quran format: { "surahId": { "verseId": "text" } }
const haleemData = quranHaleem as Record<string, Record<string, string>>;
const clearQuranData = quranClearQuran as Record<string, Record<string, string>>;
const studyQuranData = quranStudyQuran as Record<string, Record<string, string>>;

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

  const verses: LocalVerse[] = arabicSurah.verses.map((verse, index) => ({
    id: verse.id,
    verseNumber: verse.id,
    verseKey: `${surahId}:${verse.id}`,
    textArabic: verse.text,
    translationTurkish: turkishSurah?.verses[index]?.translation || "",
    translationEnglish: englishSurah?.verses[index]?.translation || "",
    translationHaleem: haleemSurah[String(verse.id)] || "",
    translationClearQuran: clearQuranSurah[String(verse.id)] || "",
    translationStudyQuran: studyQuranSurah[String(verse.id)] || "",
  }));

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
