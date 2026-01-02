#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

// Data paths
const DATA_DIR = path.join(__dirname, "../../src/data");
const QURAN_DIR = path.join(DATA_DIR, "quran");
const QURAN_MASTER_DIR = path.join(DATA_DIR, "quran-master");
const LEARNING_DIR = path.join(DATA_DIR, "learning");

// Surah metadata
const SURAHS = [
  { number: 1, name: "الفاتحة", nameLatin: "Al-Fatiha", revelationType: "meccan", ayahCount: 7 },
  { number: 2, name: "البقرة", nameLatin: "Al-Baqarah", revelationType: "medinan", ayahCount: 286 },
  { number: 3, name: "آل عمران", nameLatin: "Ali 'Imran", revelationType: "medinan", ayahCount: 200 },
  // ... (abbreviated for demo - full list in surahs.ts)
];

// Load JSON helper
function loadJSON(filePath: string): any {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

// Create MCP Server
const server = new McpServer({
  name: "quran-mcp-server",
  version: "1.0.0",
});

// Tool: Get verse by surah and ayah number
server.tool(
  "get_verse",
  "Get a specific verse with all translations",
  {
    surah: z.number().min(1).max(114).describe("Surah number (1-114)"),
    ayah: z.number().min(1).describe("Ayah/verse number"),
  },
  async ({ surah, ayah }) => {
    try {
      // Load translations
      const arabic = loadJSON(path.join(QURAN_DIR, "quran_arabic.json"));
      const turkish = loadJSON(path.join(QURAN_DIR, "quran_turkish.json"));
      const english = loadJSON(path.join(QURAN_DIR, "quran_english.json"));
      const haleem = loadJSON(path.join(QURAN_DIR, "quran_haleem.json"));
      const clearquran = loadJSON(path.join(QURAN_DIR, "quran_clearquran.json"));
      const studyquran = loadJSON(path.join(QURAN_DIR, "quran_studyquran.json"));

      // Get verse from each translation
      const surahData = arabic?.find((s: any) => s.id === surah);
      const verseArabic = surahData?.verses?.find((v: any) => v.id === ayah)?.text || "";

      const turkishVerse = turkish?.find((s: any) => s.id === surah)?.verses?.find((v: any) => v.id === ayah);
      const englishVerse = english?.find((s: any) => s.id === surah)?.verses?.find((v: any) => v.id === ayah);

      // Flat format translations
      const haleemVerse = haleem?.[surah]?.[ayah] || "";
      const clearquranVerse = clearquran?.[surah]?.[ayah] || "";
      const studyquranVerse = studyquran?.[surah]?.[ayah] || "";

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              verseKey: `${surah}:${ayah}`,
              arabic: verseArabic,
              translations: {
                turkish_diyanet: turkishVerse?.translation || "",
                english_sahih: englishVerse?.translation || "",
                english_haleem: haleemVerse,
                english_clearquran: clearquranVerse,
                english_studyquran: studyquranVerse,
              },
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
        isError: true,
      };
    }
  }
);

// Tool: Search verses
server.tool(
  "search_verses",
  "Search for verses containing a keyword in any translation",
  {
    query: z.string().describe("Search query (Arabic or any translation)"),
    limit: z.number().optional().default(10).describe("Maximum results"),
  },
  async ({ query, limit }) => {
    try {
      const results: any[] = [];
      const arabic = loadJSON(path.join(QURAN_DIR, "quran_arabic.json")) || [];
      const english = loadJSON(path.join(QURAN_DIR, "quran_english.json")) || [];
      const turkish = loadJSON(path.join(QURAN_DIR, "quran_turkish.json")) || [];

      for (const surah of arabic) {
        for (const verse of surah.verses || []) {
          const englishVerse = english.find((s: any) => s.id === surah.id)?.verses?.find((v: any) => v.id === verse.id);
          const turkishVerse = turkish.find((s: any) => s.id === surah.id)?.verses?.find((v: any) => v.id === verse.id);

          const searchText = [
            verse.text,
            englishVerse?.translation,
            turkishVerse?.translation,
          ].filter(Boolean).join(" ").toLowerCase();

          if (searchText.includes(query.toLowerCase())) {
            results.push({
              verseKey: `${surah.id}:${verse.id}`,
              arabic: verse.text,
              english: englishVerse?.translation,
              turkish: turkishVerse?.translation,
            });

            if (results.length >= limit) break;
          }
        }
        if (results.length >= limit) break;
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ count: results.length, results }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
        isError: true,
      };
    }
  }
);

// Tool: Get surah info
server.tool(
  "get_surah_info",
  "Get metadata about a surah (chapter)",
  {
    surah: z.number().min(1).max(114).describe("Surah number (1-114)"),
  },
  async ({ surah }) => {
    const surahInfo = SURAHS.find((s) => s.number === surah);
    if (!surahInfo) {
      return {
        content: [{ type: "text", text: "Surah not found" }],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(surahInfo, null, 2),
        },
      ],
    };
  }
);

// Tool: Get word timing data for a verse
server.tool(
  "get_word_timing",
  "Get word-by-word timing data for audio synchronization",
  {
    surah: z.number().min(1).max(114).describe("Surah number"),
    ayah: z.number().min(1).describe("Ayah number"),
  },
  async ({ surah, ayah }) => {
    try {
      const surahNum = surah.toString().padStart(3, "0");
      const surahData = loadJSON(path.join(QURAN_MASTER_DIR, `surah-${surahNum}.json`));

      if (!surahData || !surahData.verses) {
        return {
          content: [{ type: "text", text: "Word timing data not found" }],
          isError: true,
        };
      }

      const verseData = surahData.verses.find((v: any) => v.verseNumber === ayah);
      if (!verseData) {
        return {
          content: [{ type: "text", text: "Verse not found in timing data" }],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              verseKey: `${surah}:${ayah}`,
              words: verseData.words.map((w: any) => ({
                arabic: w.arabic,
                root: w.rootArabic,
                startTime: w.startTime,
                endTime: w.endTime,
                translations: w.translations,
              })),
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
        isError: true,
      };
    }
  }
);

// Tool: Get learning vocabulary
server.tool(
  "get_vocabulary",
  "Get Quranic vocabulary for learning (300 most frequent words, 2-grams, 3-grams)",
  {
    category: z.enum(["words", "twogram", "threegram"]).describe("Vocabulary category"),
    limit: z.number().optional().default(20).describe("Number of words to return"),
  },
  async ({ category, limit }) => {
    try {
      const fileName = category === "words" ? "words_300.json" : `${category}.json`;
      const data = loadJSON(path.join(LEARNING_DIR, fileName));

      if (!data) {
        return {
          content: [{ type: "text", text: "Vocabulary data not found" }],
          isError: true,
        };
      }

      const items = Array.isArray(data) ? data.slice(0, limit) : Object.values(data).slice(0, limit);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              category,
              count: items.length,
              items,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
        isError: true,
      };
    }
  }
);

// Tool: List all surahs
server.tool(
  "list_surahs",
  "Get a list of all 114 surahs with their metadata",
  {},
  async () => {
    // Load from surahs.ts data or return static list
    const arabic = loadJSON(path.join(QURAN_DIR, "quran_arabic.json")) || [];

    const surahs = arabic.map((s: any) => ({
      number: s.id,
      name: s.name,
      versesCount: s.verses?.length || 0,
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ count: surahs.length, surahs }, null, 2),
        },
      ],
    };
  }
);

// Tool: Get available translations
server.tool(
  "get_available_translations",
  "List all available translations and their sources",
  {},
  async () => {
    const translations = [
      { key: "arabic", language: "Arabic", source: "Tanzil.net (Uthmani)" },
      { key: "turkish_diyanet", language: "Turkish", source: "Diyanet İşleri" },
      { key: "turkish_elmalili", language: "Turkish", source: "Elmalılı Hamdi Yazır" },
      { key: "english_sahih", language: "English", source: "Sahih International" },
      { key: "english_haleem", language: "English", source: "Abdel Haleem (Oxford)" },
      { key: "english_clearquran", language: "English", source: "Clear Quran (Khattab)" },
      { key: "english_studyquran", language: "English", source: "Study Quran (Nasr)" },
    ];

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ translations }, null, 2),
        },
      ],
    };
  }
);

// ============= NEW TOOLS =============

// Tool: Get audio URL for a verse
server.tool(
  "get_audio_url",
  "Get audio URL for a specific verse from a reciter",
  {
    surah: z.number().min(1).max(114).describe("Surah number"),
    ayah: z.number().min(1).describe("Ayah number"),
    reciter: z.enum(["mishari", "abdulbasit", "sudais", "husary", "shatri"]).optional().default("mishari").describe("Reciter name"),
  },
  async ({ surah, ayah, reciter }) => {
    const reciterFolders: Record<string, string> = {
      mishari: "Mishari_Rashid_Alafasy",
      abdulbasit: "AbdulBaset_AbdulSamad_Murattal",
      sudais: "Abdurrahman_as-Sudais",
      husary: "Mahmoud_Khalil_Al-Husary",
      shatri: "Abu_Bakr_al-Shatri",
    };

    const folder = reciterFolders[reciter] || reciterFolders.mishari;
    const surahPadded = surah.toString().padStart(3, "0");
    const ayahPadded = ayah.toString().padStart(3, "0");

    const url = `https://verses.quran.com/${folder}/${surahPadded}${ayahPadded}.mp3`;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            verseKey: `${surah}:${ayah}`,
            reciter,
            audioUrl: url,
            fullChapterUrl: `https://download.quranicaudio.com/quran/${folder.toLowerCase()}/${surahPadded}.mp3`,
          }, null, 2),
        },
      ],
    };
  }
);

// Tool: Get Study Quran commentary
server.tool(
  "get_commentary",
  "Get Study Quran commentary for a verse",
  {
    surah: z.number().min(1).max(114).describe("Surah number"),
    ayah: z.number().min(1).describe("Ayah number"),
  },
  async ({ surah, ayah }) => {
    try {
      const commentary = loadJSON(path.join(QURAN_DIR, "studyquran_commentary.json"));

      if (!commentary) {
        return {
          content: [{ type: "text", text: "Commentary data not found" }],
          isError: true,
        };
      }

      const key = `${surah}:${ayah}`;
      const text = commentary.commentary?.[key] || "";

      if (!text) {
        return {
          content: [{ type: "text", text: `No commentary found for ${key}` }],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              verseKey: key,
              source: "The Study Quran (Seyyed Hossein Nasr)",
              commentary: text,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
        isError: true,
      };
    }
  }
);

// Tool: Get verse with context (surrounding verses)
server.tool(
  "get_verse_context",
  "Get a verse with surrounding verses for context",
  {
    surah: z.number().min(1).max(114).describe("Surah number"),
    ayah: z.number().min(1).describe("Ayah number"),
    contextSize: z.number().optional().default(2).describe("Number of verses before and after"),
  },
  async ({ surah, ayah, contextSize }) => {
    try {
      const arabic = loadJSON(path.join(QURAN_DIR, "quran_arabic.json")) || [];
      const turkish = loadJSON(path.join(QURAN_DIR, "quran_turkish.json")) || [];

      const surahData = arabic.find((s: any) => s.id === surah);
      const turkishSurah = turkish.find((s: any) => s.id === surah);

      if (!surahData) {
        return {
          content: [{ type: "text", text: "Surah not found" }],
          isError: true,
        };
      }

      const verses = surahData.verses || [];
      const startAyah = Math.max(1, ayah - contextSize);
      const endAyah = Math.min(verses.length, ayah + contextSize);

      const contextVerses = [];

      for (let i = startAyah; i <= endAyah; i++) {
        const verse = verses.find((v: any) => v.id === i);
        const trVerse = turkishSurah?.verses?.find((v: any) => v.id === i);

        if (verse) {
          contextVerses.push({
            verseKey: `${surah}:${i}`,
            isTarget: i === ayah,
            arabic: verse.text,
            turkish: trVerse?.translation || "",
          });
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              targetVerse: `${surah}:${ayah}`,
              contextVerses,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
        isError: true,
      };
    }
  }
);

// Tool: Compare translations for a verse
server.tool(
  "compare_translations",
  "Compare all available translations for a specific verse",
  {
    surah: z.number().min(1).max(114).describe("Surah number"),
    ayah: z.number().min(1).describe("Ayah number"),
  },
  async ({ surah, ayah }) => {
    try {
      const translations: Record<string, string> = {};

      // Load all translations
      const files = [
        { name: "Arabic (Uthmani)", file: "quran_arabic.json", field: "text" },
        { name: "Turkish (Diyanet)", file: "quran_turkish.json", field: "translation" },
        { name: "English (Sahih)", file: "quran_english.json", field: "translation" },
      ];

      for (const { name, file, field } of files) {
        const data = loadJSON(path.join(QURAN_DIR, file));
        if (data) {
          const surahData = data.find((s: any) => s.id === surah);
          const verse = surahData?.verses?.find((v: any) => v.id === ayah);
          if (verse) {
            translations[name] = verse[field] || "";
          }
        }
      }

      // Flat format translations
      const flatFiles = [
        { name: "English (Haleem)", file: "quran_haleem.json" },
        { name: "English (Clear Quran)", file: "quran_clearquran.json" },
        { name: "English (Study Quran)", file: "quran_studyquran.json" },
      ];

      for (const { name, file } of flatFiles) {
        const data = loadJSON(path.join(QURAN_DIR, file));
        if (data && data[surah]?.[ayah]) {
          translations[name] = data[surah][ayah];
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              verseKey: `${surah}:${ayah}`,
              translationCount: Object.keys(translations).length,
              translations,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
        isError: true,
      };
    }
  }
);

// Tool: Get Quran statistics
server.tool(
  "get_statistics",
  "Get various statistics about the Quran",
  {
    type: z.enum(["overview", "surah", "words"]).describe("Type of statistics"),
  },
  async ({ type }) => {
    try {
      const arabic = loadJSON(path.join(QURAN_DIR, "quran_arabic.json")) || [];

      if (type === "overview") {
        let totalVerses = 0;
        let totalWords = 0;

        for (const surah of arabic) {
          totalVerses += surah.verses?.length || 0;
          for (const verse of surah.verses || []) {
            totalWords += verse.text?.split(" ").length || 0;
          }
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                totalSurahs: arabic.length,
                totalVerses,
                totalWords,
                meccanSurahs: 86,
                medinanSurahs: 28,
                longestSurah: { number: 2, name: "Al-Baqarah", verses: 286 },
                shortestSurah: { number: 108, name: "Al-Kawthar", verses: 3 },
              }, null, 2),
            },
          ],
        };
      }

      if (type === "surah") {
        const surahStats = arabic.map((s: any) => {
          const wordCount = s.verses?.reduce((acc: number, v: any) => acc + (v.text?.split(" ").length || 0), 0) || 0;
          return {
            number: s.id,
            name: s.name,
            verseCount: s.verses?.length || 0,
            wordCount,
          };
        });

        const byVerses = [...surahStats].sort((a, b) => b.verseCount - a.verseCount);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                totalSurahs: surahStats.length,
                longestByVerses: byVerses.slice(0, 5),
                shortestByVerses: byVerses.slice(-5).reverse(),
              }, null, 2),
            },
          ],
        };
      }

      if (type === "words") {
        const wordsData = loadJSON(path.join(LEARNING_DIR, "words_300.json"));
        if (wordsData) {
          const items = Object.values(wordsData) as any[];
          const topWords = items.sort((a, b) => (b.frequency || 0) - (a.frequency || 0)).slice(0, 20);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  description: "Top 20 most frequent words in the Quran",
                  words: topWords.map((w) => ({
                    arabic: w.arabic,
                    frequency: w.frequency,
                    meaningEn: w.translations?.en,
                    meaningTr: w.translations?.tr,
                  })),
                }, null, 2),
              },
            ],
          };
        }
      }

      return {
        content: [{ type: "text", text: "Statistics not available" }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
        isError: true,
      };
    }
  }
);

// Tool: Search by word root
server.tool(
  "search_by_root",
  "Search for verses containing words with a specific Arabic root",
  {
    root: z.string().describe("Arabic root (e.g., 'كتب' or 'ktb')"),
    limit: z.number().optional().default(10).describe("Maximum results"),
  },
  async ({ root, limit }) => {
    try {
      const results: any[] = [];
      const arabic = loadJSON(path.join(QURAN_DIR, "quran_arabic.json")) || [];

      // Search through word timing data for roots
      for (let surahNum = 1; surahNum <= 114 && results.length < limit; surahNum++) {
        const surahPadded = surahNum.toString().padStart(3, "0");
        const surahData = loadJSON(path.join(QURAN_MASTER_DIR, `surah-${surahPadded}.json`));

        if (!surahData?.verses) continue;

        for (const verse of surahData.verses) {
          if (results.length >= limit) break;

          for (const word of verse.words || []) {
            const wordRoot = word.root || word.rootArabic || "";
            if (wordRoot.includes(root) || root.includes(wordRoot)) {
              const arabicSurah = arabic.find((s: any) => s.id === surahNum);
              const arabicVerse = arabicSurah?.verses?.find((v: any) => v.id === verse.verseNumber);

              results.push({
                verseKey: `${surahNum}:${verse.verseNumber}`,
                matchedWord: word.arabic,
                root: wordRoot,
                verseText: arabicVerse?.text?.substring(0, 100) + "...",
              });
              break;
            }
          }
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              searchedRoot: root,
              count: results.length,
              results,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
        isError: true,
      };
    }
  }
);

// Tool: Get random verse
server.tool(
  "get_random_verse",
  "Get a random verse from the Quran (for daily inspiration)",
  {},
  async () => {
    try {
      const arabic = loadJSON(path.join(QURAN_DIR, "quran_arabic.json")) || [];
      const turkish = loadJSON(path.join(QURAN_DIR, "quran_turkish.json")) || [];
      const english = loadJSON(path.join(QURAN_DIR, "quran_english.json")) || [];

      // Random surah
      const randomSurahIndex = Math.floor(Math.random() * arabic.length);
      const surah = arabic[randomSurahIndex];

      // Random verse
      const randomVerseIndex = Math.floor(Math.random() * surah.verses.length);
      const verse = surah.verses[randomVerseIndex];

      const turkishSurah = turkish.find((s: any) => s.id === surah.id);
      const englishSurah = english.find((s: any) => s.id === surah.id);

      const turkishVerse = turkishSurah?.verses?.find((v: any) => v.id === verse.id);
      const englishVerse = englishSurah?.verses?.find((v: any) => v.id === verse.id);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              verseKey: `${surah.id}:${verse.id}`,
              surahName: surah.name,
              arabic: verse.text,
              turkish: turkishVerse?.translation || "",
              english: englishVerse?.translation || "",
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
        isError: true,
      };
    }
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Quran MCP Server running on stdio");
}

main().catch(console.error);
