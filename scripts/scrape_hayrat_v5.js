/**
 * Hayrat Neşriyat Meal Scraper v5 - Sure Bazlı + Referans Eşleştirme
 *
 * Meal içindeki (n) referanslarını açıklamalarla doğru eşleştirir.
 * Her ayetin mealindeki tüm referanslar için ilgili açıklamaları toplar.
 *
 * Kullanım:
 *   node scrape_hayrat_v5.js          # Tüm sureleri çek
 *   node scrape_hayrat_v5.js --test   # Sadece Fatiha'yı test et
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Sure isimleri (URL için)
const SURAH_NAMES = [
  "1. FÂTİHA", "2. BAKARA", "3. ÂL-İ İMRÂN", "4. NİSÂ", "5. MÂİDE",
  "6. EN'ÂM", "7. A'RÂF", "8. ENFÂL", "9. TEVBE", "10. YÛNUS",
  "11. HÛD", "12. YÛSUF", "13. RA'D", "14. İBRÂHÎM", "15. HİCR",
  "16. NAHL", "17. İSRÂ", "18. KEHF", "19. MERYEM", "20. TÂHÂ",
  "21. ENBİYÂ", "22. HAC", "23. MÜ'MİNÛN", "24. NÛR", "25. FURKĀN",
  "26. ŞUARÂ", "27. NEML", "28. KASAS", "29. ANKEBÛT", "30. RÛM",
  "31. LOKMÂN", "32. SECDE", "33. AHZÂB", "34. SEBE'", "35. FÂTIR",
  "36. YÂSÎN", "37. SÂFFÂT", "38. SÂD", "39. ZÜMER", "40. MÜ'MİN",
  "41. FUSSİLET", "42. ŞÛRÂ", "43. ZUHRUF", "44. DUHÂN", "45. CÂSİYE",
  "46. AHKĀF", "47. MUHAMMED", "48. FETİH", "49. HUCURÂT", "50. KĀF",
  "51. ZÂRİYÂT", "52. TÛR", "53. NECM", "54. KAMER", "55. RAHMÂN",
  "56. VÂKIA", "57. HADÎD", "58. MÜCÂDELE", "59. HAŞR", "60. MÜMTEHİNE",
  "61. SAF", "62. CUM'A", "63. MÜNÂFIKŪN", "64. TEGĀBÜN", "65. TALÂK",
  "66. TAHRÎM", "67. MÜLK", "68. KALEM", "69. HÂKKA", "70. MEÂRİC",
  "71. NÛH", "72. CİN", "73. MÜZZEMMİL", "74. MÜDDESSİR", "75. KIYÂME",
  "76. İNSÂN", "77. MÜRSELÂT", "78. NEBE'", "79. NÂZİÂT", "80. ABESE",
  "81. TEKVÎR", "82. İNFİTÂR", "83. MUTAFFİFÎN", "84. İNŞİKĀK", "85. BURÛC",
  "86. TÂRIK", "87. A'LÂ", "88. GĀŞİYE", "89. FECR", "90. BELED",
  "91. ŞEMS", "92. LEYL", "93. DUHÂ", "94. İNŞİRÂH", "95. TÎN",
  "96. ALAK", "97. KADR", "98. BEYYİNE", "99. ZİLZÂL", "100. ÂDİYÂT",
  "101. KĀRİA", "102. TEKÂSÜR", "103. ASR", "104. HÜMEZE", "105. FÎL",
  "106. KUREYŞ", "107. MÂÛN", "108. KEVSER", "109. KÂFİRÛN", "110. NASR",
  "111. TEBBET", "112. İHLÂS", "113. FELAK", "114. NÂS"
];

// HTML entity decode ve temizlik
function decodeEntities(text) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/<\/span[^>]*>?/gi, '')  // Kalan span taglarını temizle
    .replace(/<span[^>]*>?/gi, '')
    .replace(/<\/?[a-z][^>]*>?/gi, '')  // Diğer HTML taglarını temizle
    .trim();
}

// HTTPS GET request
function fetchUrl(urlPath, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'kulliyat.risale.online',
      path: urlPath,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
      },
      timeout: timeout
    };

    const req = https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Meal içindeki tüm (n) referanslarını bul
function findReferences(text) {
  const refs = [];
  // (1), (2), ... (99) formatında referansları bul
  const regex = /\((\d+)\)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    refs.push(parseInt(match[1]));
  }
  return refs;
}

// Sure sayfasını parse et
function parseSurahPage(html, surahNo) {
  const verses = [];
  const explanations = {};

  // Tüm p etiketlerini çıkar
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match;

  while ((match = pRegex.exec(html)) !== null) {
    let text = match[1]
      .replace(/<[^>]+>/g, ' ')  // HTML taglarını boşlukla değiştir
      .replace(/\s+/g, ' ')
      .trim();
    text = decodeEntities(text);

    if (text.length < 3) continue;

    // Ayet pattern: "1. metin" veya "1 . metin"
    const verseMatch = text.match(/^(\d+)\s*\.\s*([\s\S]+)$/);
    if (verseMatch) {
      const verseNo = parseInt(verseMatch[1]);
      const verseText = verseMatch[2].trim();

      // Meal içindeki referansları bul
      const refs = findReferences(verseText);

      verses.push({
        surah: surahNo,
        verse: verseNo,
        text: verseText,
        references: refs
      });
      continue;
    }

    // Açıklama pattern: "1- açıklama" veya "1 - açıklama"
    const expMatch = text.match(/^(\d+)\s*[-–—]\s*([\s\S]+)$/);
    if (expMatch) {
      const expNo = parseInt(expMatch[1]);
      let expText = expMatch[2].trim();

      // Açıklama içindeki kaynak referanslarını temizle (sonundaki)
      // Örn: "(Sözler, 1. Söz, 3)" gibi

      explanations[expNo] = expText;
    }
  }

  return { verses, explanations };
}

// Ana fonksiyon
async function main() {
  console.log('Hayrat Meal Scraper v5 başlatılıyor...\n');
  console.log('Bu versiyon meal içindeki (n) referanslarını açıklamalarla eşleştirir.\n');

  const outputDir = path.join(__dirname, '../src/data/quran');

  // Test modu kontrolü
  const testMode = process.argv.includes('--test');
  const maxSurah = testMode ? 1 : 114;

  const allData = {
    metadata: {
      source: "Hayrat Neşriyat Meali",
      url: "https://kuran.hayrat.com.tr",
      type: "Turkish Quran Translation with Tafsir",
      scraped_at: new Date().toISOString(),
      version: "v5 - referans eşleştirmeli"
    },
    translations: {},
    tafsir: {}
  };

  let totalVerses = 0;
  let totalTafsir = 0;
  let failedSurahs = [];

  for (let surahNo = 1; surahNo <= maxSurah; surahNo++) {
    const surahName = SURAH_NAMES[surahNo - 1];
    process.stdout.write(`Sure ${surahNo} (${surahName})... `);

    try {
      const urlPath = '/meal/sure/' + encodeURIComponent(surahName);
      const html = await fetchUrl(urlPath);
      const { verses, explanations } = parseSurahPage(html, surahNo);

      let surahVerseCount = 0;
      let surahTafsirCount = 0;

      for (const v of verses) {
        const key = `${surahNo}:${v.verse}`;
        allData.translations[key] = v.text;
        totalVerses++;
        surahVerseCount++;

        // Bu ayetin referanslarına karşılık gelen açıklamaları topla
        if (v.references.length > 0) {
          const tafsirParts = [];

          for (const refNo of v.references) {
            if (explanations[refNo]) {
              tafsirParts.push(`(${refNo}) ${explanations[refNo]}`);
            }
          }

          if (tafsirParts.length > 0) {
            allData.tafsir[key] = tafsirParts.join('\n\n');
            totalTafsir++;
            surahTafsirCount++;
          }
        }
      }

      console.log(`${surahVerseCount} ayet, ${surahTafsirCount} tefsir`);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (err) {
      console.log(`HATA: ${err.message}`);
      failedSurahs.push(surahNo);
    }

    // Her 10 surede bir backup
    if (surahNo % 10 === 0) {
      const backupPath = path.join(outputDir, 'hayrat_meal_v5_backup.json');
      fs.writeFileSync(backupPath, JSON.stringify(allData, null, 2), 'utf8');
      console.log(`[Backup: ${totalVerses} ayet, ${totalTafsir} tefsir]\n`);
    }
  }

  // Başarısız sureleri yeniden dene
  if (failedSurahs.length > 0) {
    console.log(`\nBaşarısız sureler yeniden deneniyor: ${failedSurahs.join(', ')}`);

    for (const surahNo of failedSurahs) {
      const surahName = SURAH_NAMES[surahNo - 1];
      process.stdout.write(`Yeniden: Sure ${surahNo}... `);

      try {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Daha uzun bekle

        const urlPath = '/meal/sure/' + encodeURIComponent(surahName);
        const html = await fetchUrl(urlPath, 60000); // Daha uzun timeout
        const { verses, explanations } = parseSurahPage(html, surahNo);

        for (const v of verses) {
          const key = `${surahNo}:${v.verse}`;
          if (!allData.translations[key]) {
            allData.translations[key] = v.text;
            totalVerses++;
          }

          if (v.references.length > 0 && !allData.tafsir[key]) {
            const tafsirParts = [];
            for (const refNo of v.references) {
              if (explanations[refNo]) {
                tafsirParts.push(`(${refNo}) ${explanations[refNo]}`);
              }
            }
            if (tafsirParts.length > 0) {
              allData.tafsir[key] = tafsirParts.join('\n\n');
              totalTafsir++;
            }
          }
        }

        console.log(`${verses.length} ayet`);
      } catch (err) {
        console.log(`BAŞARISIZ: ${err.message}`);
      }
    }
  }

  // Son kayıt
  const outputPath = path.join(outputDir, 'hayrat_meal.json');
  fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2), 'utf8');

  console.log(`\n========================================`);
  console.log(`Toplam ${totalVerses} ayet çekildi`);
  console.log(`Toplam ${totalTafsir} tefsir eşleştirildi`);
  console.log(`Kaydedildi: ${outputPath}`);
  console.log(`========================================`);
}

// Çalıştır
main().catch(err => {
  console.error('Kritik hata:', err);
  process.exit(1);
});
