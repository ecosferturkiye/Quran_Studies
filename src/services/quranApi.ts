const BASE_URL = "https://api.quran.com/api/v4";

// Translation IDs
const TRANSLATIONS = {
  english: 131,        // Sahih International
  turkishDiyanet: 77,  // Diyanet İşleri
  turkishElmalili: 52, // Elmalılı Hamdi Yazır
};

export interface Verse {
  id: number;
  verseNumber: number;
  verseKey: string;
  textArabic: string;
  translationEnglish: string;
  translationTurkishDiyanet: string;
  translationTurkishElmalili: string;
  pageNumber: number;
  juzNumber: number;
}

interface ApiVerseText {
  id: number;
  verse_key: string;
  text_uthmani: string;
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

export async function fetchVersesByChapter(chapterId: number): Promise<Verse[]> {
  try {
    // Fetch Arabic text
    const arabicResponse = await fetch(
      `${BASE_URL}/quran/verses/uthmani?chapter_number=${chapterId}`
    );
    const arabicData = await arabicResponse.json();
    const arabicVerses: ApiVerseText[] = arabicData.verses || [];

    // Fetch translations (English and Turkish - Diyanet & Elmalili)
    const translationsResponse = await fetch(
      `${BASE_URL}/verses/by_chapter/${chapterId}?translations=${TRANSLATIONS.english},${TRANSLATIONS.turkishDiyanet},${TRANSLATIONS.turkishElmalili}&per_page=300`
    );
    const translationsData = await translationsResponse.json();
    const translationVerses: ApiVerse[] = translationsData.verses || [];

    // Combine data
    const verses: Verse[] = arabicVerses.map((arabicVerse, index) => {
      const translationVerse = translationVerses[index];

      const englishTranslation = translationVerse?.translations?.find(
        (t) => t.resource_id === TRANSLATIONS.english
      );
      const diyanetTranslation = translationVerse?.translations?.find(
        (t) => t.resource_id === TRANSLATIONS.turkishDiyanet
      );
      const elmaliliTranslation = translationVerse?.translations?.find(
        (t) => t.resource_id === TRANSLATIONS.turkishElmalili
      );

      // Clean HTML tags from translations
      const cleanText = (text: string) => {
        return text?.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() || "";
      };

      return {
        id: arabicVerse.id,
        verseNumber: index + 1,
        verseKey: arabicVerse.verse_key,
        textArabic: arabicVerse.text_uthmani,
        translationEnglish: cleanText(englishTranslation?.text || ""),
        translationTurkishDiyanet: cleanText(diyanetTranslation?.text || ""),
        translationTurkishElmalili: cleanText(elmaliliTranslation?.text || ""),
        pageNumber: translationVerse?.page_number || 0,
        juzNumber: translationVerse?.juz_number || 0,
      };
    });

    return verses;
  } catch (error) {
    console.error("Error fetching verses:", error);
    throw error;
  }
}

export async function fetchSingleVerse(
  chapterId: number,
  verseNumber: number
): Promise<Verse | null> {
  try {
    const verseKey = `${chapterId}:${verseNumber}`;

    // Fetch Arabic text
    const arabicResponse = await fetch(
      `${BASE_URL}/quran/verses/uthmani?verse_key=${verseKey}`
    );
    const arabicData = await arabicResponse.json();
    const arabicVerse: ApiVerseText = arabicData.verses?.[0];

    if (!arabicVerse) return null;

    // Fetch translations
    const translationsResponse = await fetch(
      `${BASE_URL}/verses/by_key/${verseKey}?translations=${TRANSLATIONS.english},${TRANSLATIONS.turkishDiyanet},${TRANSLATIONS.turkishElmalili}`
    );
    const translationsData = await translationsResponse.json();
    const translationVerse: ApiVerse = translationsData.verse;

    const englishTranslation = translationVerse?.translations?.find(
      (t) => t.resource_id === TRANSLATIONS.english
    );
    const diyanetTranslation = translationVerse?.translations?.find(
      (t) => t.resource_id === TRANSLATIONS.turkishDiyanet
    );
    const elmaliliTranslation = translationVerse?.translations?.find(
      (t) => t.resource_id === TRANSLATIONS.turkishElmalili
    );

    const cleanText = (text: string) => {
      return text?.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() || "";
    };

    return {
      id: arabicVerse.id,
      verseNumber,
      verseKey: arabicVerse.verse_key,
      textArabic: arabicVerse.text_uthmani,
      translationEnglish: cleanText(englishTranslation?.text || ""),
      translationTurkishDiyanet: cleanText(diyanetTranslation?.text || ""),
      translationTurkishElmalili: cleanText(elmaliliTranslation?.text || ""),
      pageNumber: translationVerse?.page_number || 0,
      juzNumber: translationVerse?.juz_number || 0,
    };
  } catch (error) {
    console.error("Error fetching verse:", error);
    return null;
  }
}
