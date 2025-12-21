// Hybrid Quran Service
// - Arabic, Diyanet (Turkish), English: Local JSON files
// - Elmalılı (Turkish): quran.com API

import { getLocalVersesByChapter, LocalVerse } from "./quranLocal";

const QURAN_API_BASE = "https://api.quran.com/api/v4";
const ELMALILI_TRANSLATION_ID = 52;

export interface Verse {
  id: number;
  verseNumber: number;
  verseKey: string;
  textArabic: string;
  translationTurkishDiyanet: string;
  translationTurkishElmalili: string;
  translationEnglish: string;
  translationHaleem: string;
  translationClearQuran: string;
  translationStudyQuran: string;
  pageNumber: number;
  juzNumber: number;
}

interface ApiTranslation {
  resource_id: number;
  text: string;
}

interface ApiVerse {
  id: number;
  verse_number: number;
  verse_key: string;
  page_number: number;
  juz_number: number;
  translations: ApiTranslation[];
}

// Clean HTML tags from text
function cleanText(text: string): string {
  return text?.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() || "";
}

// Fetch Elmalılı translations from quran.com API
async function fetchElmaliliTranslations(
  chapterId: number
): Promise<Map<number, string>> {
  const translations = new Map<number, string>();

  try {
    const response = await fetch(
      `${QURAN_API_BASE}/verses/by_chapter/${chapterId}?translations=${ELMALILI_TRANSLATION_ID}&per_page=300`
    );
    const data = await response.json();
    const verses: ApiVerse[] = data.verses || [];

    verses.forEach((verse) => {
      const elmaliliText = verse.translations?.find(
        (t) => t.resource_id === ELMALILI_TRANSLATION_ID
      );
      if (elmaliliText) {
        translations.set(verse.verse_number, cleanText(elmaliliText.text));
      }
    });
  } catch (error) {
    console.error("Error fetching Elmalili translations:", error);
  }

  return translations;
}

// Fetch verse metadata (page, juz) from quran.com API
async function fetchVerseMetadata(
  chapterId: number
): Promise<Map<number, { page: number; juz: number }>> {
  const metadata = new Map<number, { page: number; juz: number }>();

  try {
    const response = await fetch(
      `${QURAN_API_BASE}/verses/by_chapter/${chapterId}?per_page=300`
    );
    const data = await response.json();
    const verses: ApiVerse[] = data.verses || [];

    verses.forEach((verse) => {
      metadata.set(verse.verse_number, {
        page: verse.page_number,
        juz: verse.juz_number,
      });
    });
  } catch (error) {
    console.error("Error fetching verse metadata:", error);
  }

  return metadata;
}

export async function fetchVersesByChapter(chapterId: number): Promise<Verse[]> {
  // Get local data (Arabic, Diyanet, English)
  const localVerses = getLocalVersesByChapter(chapterId);

  if (localVerses.length === 0) {
    throw new Error("Surah not found in local data");
  }

  // Fetch Elmalılı translations and metadata from API
  const [elmaliliMap, metadataMap] = await Promise.all([
    fetchElmaliliTranslations(chapterId),
    fetchVerseMetadata(chapterId),
  ]);

  // Combine all data
  const verses: Verse[] = localVerses.map((localVerse) => {
    const metadata = metadataMap.get(localVerse.verseNumber) || {
      page: 0,
      juz: 0,
    };

    return {
      id: localVerse.id,
      verseNumber: localVerse.verseNumber,
      verseKey: localVerse.verseKey,
      textArabic: localVerse.textArabic,
      translationTurkishDiyanet: localVerse.translationTurkish,
      translationTurkishElmalili:
        elmaliliMap.get(localVerse.verseNumber) || "",
      translationEnglish: localVerse.translationEnglish,
      translationHaleem: localVerse.translationHaleem,
      translationClearQuran: localVerse.translationClearQuran,
      translationStudyQuran: localVerse.translationStudyQuran,
      pageNumber: metadata.page,
      juzNumber: metadata.juz,
    };
  });

  return verses;
}

// Offline-only version (no API calls)
export function getVersesOffline(chapterId: number): Verse[] {
  const localVerses = getLocalVersesByChapter(chapterId);

  return localVerses.map((localVerse) => ({
    id: localVerse.id,
    verseNumber: localVerse.verseNumber,
    verseKey: localVerse.verseKey,
    textArabic: localVerse.textArabic,
    translationTurkishDiyanet: localVerse.translationTurkish,
    translationTurkishElmalili: "", // Not available offline
    translationEnglish: localVerse.translationEnglish,
    translationHaleem: localVerse.translationHaleem,
    translationClearQuran: localVerse.translationClearQuran,
    translationStudyQuran: localVerse.translationStudyQuran,
    pageNumber: 0,
    juzNumber: 0,
  }));
}
