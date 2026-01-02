/**
 * Hayrat Neşriyat Meal Scraper v6 - Sayfa Bazlı + Referans Eşleştirme
 *
 * Her sayfadaki mealleri ve açıklamaları çeker.
 * Meal içindeki (n) referanslarını aynı sayfadaki n- açıklamalarıyla eşleştirir.
 *
 * Kullanım:
 *   node scrape_hayrat_v6.js          # Tüm 605 sayfayı çek
 *   node scrape_hayrat_v6.js --test   # İlk 5 sayfayı test et
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Sure başlangıç sayfaları
const SURAH_START_PAGES = {
  0: 1, 1: 2, 49: 3, 76: 4, 105: 5, 127: 6, 150: 7, 176: 8, 186: 9, 207: 10,
  220: 11, 234: 12, 248: 13, 254: 14, 261: 15, 266: 16, 281: 17, 292: 18, 304: 19, 311: 20,
  321: 21, 331: 22, 341: 23, 349: 24, 358: 25, 366: 26, 376: 27, 384: 28, 395: 29, 403: 30,
  410: 31, 414: 32, 417: 33, 427: 34, 433: 35, 439: 36, 445: 37, 452: 38, 458: 39, 466: 40,
  476: 41, 482: 42, 488: 43, 495: 44, 498: 45, 501: 46, 506: 47, 510: 48, 514: 49, 517: 50,
  520: 51, 523: 52, 526: 53, 528: 54, 531: 55, 534: 56, 537: 57, 541: 58, 545: 59, 548: 60,
  551: 61, 553: 62, 554: 63, 556: 64, 558: 65, 560: 66, 562: 67, 564: 68, 566: 69, 568: 70,
  570: 71, 572: 72, 574: 73, 575: 74, 577: 75, 578: 76, 580: 77, 582: 78, 583: 79, 585: 80,
  586: 81, 587: 82, 589: 84, 590: 85, 591: 86, 592: 88, 593: 89, 594: 90, 595: 91, 596: 93,
  597: 95, 598: 97, 599: 99, 600: 101, 601: 103, 602: 106, 603: 109, 604: 112
};

// HTML entity decode ve temizlik
function cleanText(text) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/<\/span[^>]*>?/gi, '')
    .replace(/<span[^>]*>?/gi, '')
    .replace(/<\/?[a-z][^>]*>?/gi, '')
    .replace(/\s+/g, ' ')
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

// Hangi surenin sayfasında olduğumuzu bul
function getSurahForPage(pageNo) {
  let currentSurah = 2;
  for (const [page, surah] of Object.entries(SURAH_START_PAGES)) {
    if (parseInt(page) <= pageNo) {
      currentSurah = surah;
    }
  }
  return currentSurah;
}

// Meal içindeki tüm (n) referanslarını bul
function findReferences(text) {
  const refs = [];
  const regex = /\((\d+)\)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const num = parseInt(match[1]);
    // Sadece makul referans numaralarını al (1-99)
    if (num >= 1 && num <= 99) {
      refs.push(num);
    }
  }
  return refs;
}

// Sayfa içeriğini parse et
function parsePage(html, currentSurah) {
  const verses = [];
  const explanations = {};

  // Tüm p etiketlerini çıkar
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match;

  while ((match = pRegex.exec(html)) !== null) {
    let text = match[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    text = cleanText(text);

    if (text.length < 3) continue;

    // Ayet pattern: "1. metin" veya "1 . metin"
    const verseMatch = text.match(/^(\d+)\s*\.\s*([\s\S]+)$/);
    if (verseMatch) {
      const verseNo = parseInt(verseMatch[1]);
      const verseText = verseMatch[2].trim();
      const refs = findReferences(verseText);

      verses.push({
        surah: currentSurah,
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
      explanations[expNo] = expMatch[2].trim();
    }
  }

  return { verses, explanations };
}

// Ana fonksiyon
async function main() {
  console.log('Hayrat Meal Scraper v6 başlatılıyor...\n');
  console.log('Sayfa bazlı çekim + referans eşleştirme\n');

  const outputDir = path.join(__dirname, '../src/data/quran');

  // Test modu kontrolü
  const testMode = process.argv.includes('--test');
  const maxPage = testMode ? 5 : 605;

  const allData = {
    metadata: {
      source: "Hayrat Neşriyat Meali",
      url: "https://kuran.hayrat.com.tr",
      type: "Turkish Quran Translation with Tafsir",
      scraped_at: new Date().toISOString(),
      version: "v6 - sayfa bazlı + referans eşleştirme",
      total_pages: maxPage
    },
    translations: {},
    tafsir: {}
  };

  let totalVerses = 0;
  let totalTafsir = 0;
  let lastSurah = 1;

  // Önce Fatiha'yı özel olarak çek
  console.log('Fatiha suresi çekiliyor...');
  try {
    const fatihaUrl = '/meal/sure/' + encodeURIComponent('1. FÂTİHA');
    const fatihaHtml = await fetchUrl(fatihaUrl);
    const { verses, explanations } = parsePage(fatihaHtml, 1);

    for (const v of verses) {
      const key = `1:${v.verse}`;
      allData.translations[key] = v.text;
      totalVerses++;

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
        }
      }
    }
    console.log(`Fatiha: ${verses.length} ayet, ${Object.keys(explanations).length} açıklama\n`);
  } catch (err) {
    console.log(`Fatiha hatası: ${err.message}\n`);
  }

  // Sayfa bazlı çekim (Bakara'dan itibaren)
  for (let pageNo = 1; pageNo < maxPage; pageNo++) {
    const currentSurah = getSurahForPage(pageNo);

    if (currentSurah !== lastSurah) {
      console.log(`\n--- Sure ${currentSurah} ---`);
      lastSurah = currentSurah;
    }

    process.stdout.write(`Sayfa ${pageNo}... `);

    try {
      const html = await fetchUrl(`/meal/sayfa?sayfaNo=${pageNo}`);
      const { verses, explanations } = parsePage(html, currentSurah);

      let pageVerseCount = 0;
      let pageTafsirCount = 0;

      for (const v of verses) {
        // Ayet numarasına göre sureyi belirle (ayet 1 ise yeni sure olabilir)
        let surahNo = currentSurah;

        const key = `${surahNo}:${v.verse}`;

        if (!allData.translations[key]) {
          allData.translations[key] = v.text;
          totalVerses++;
          pageVerseCount++;

          // Referansları eşleştir
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
              pageTafsirCount++;
            }
          }
        }
      }

      console.log(`${pageVerseCount} ayet, ${pageTafsirCount} tefsir`);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (err) {
      console.log(`HATA: ${err.message}`);
    }

    // Her 50 sayfada bir backup
    if (pageNo % 50 === 0) {
      const backupPath = path.join(outputDir, 'hayrat_meal_v6_backup.json');
      fs.writeFileSync(backupPath, JSON.stringify(allData, null, 2), 'utf8');
      console.log(`\n[Backup: ${totalVerses} ayet, ${totalTafsir} tefsir]\n`);
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
