/**
 * Hayrat Neşriyat Meal Scraper v4 - Sayfa Bazlı
 *
 * Kaynak: https://kulliyat.risale.online/meal
 * Veri: Türkçe meal ve açıklamalar (tefsir)
 *
 * Kullanım:
 *   node scrape_hayrat_meal.js --test     # İlk 10 sayfayı test et
 *   node scrape_hayrat_meal.js --all      # Tüm 605 sayfayı çek
 *   node scrape_hayrat_meal.js            # İlk 50 sayfayı çek
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Sayfa -> Sure eşleşmeleri (hangi sayfada hangi sure başlıyor)
const SURAH_START_PAGES = {
  0: 1,    // Fatiha (sayfa 0'da Bakara başlıyor, Fatiha ayrı)
  1: 2,    // Bakara
  49: 3,   // Al-i İmran
  76: 4,   // Nisa
  105: 5,  // Maide
  127: 6,  // En'am
  150: 7,  // A'raf
  176: 8,  // Enfal
  186: 9,  // Tevbe
  207: 10, // Yunus
  220: 11, // Hud
  234: 12, // Yusuf
  248: 13, // Ra'd
  254: 14, // Ibrahim
  261: 15, // Hicr
  266: 16, // Nahl
  281: 17, // Isra
  292: 18, // Kehf
  304: 19, // Meryem
  311: 20, // Taha
  321: 21, // Enbiya
  331: 22, // Hac
  341: 23, // Mu'minun
  349: 24, // Nur
  358: 25, // Furkan
  366: 26, // Şuara
  376: 27, // Neml
  384: 28, // Kasas
  395: 29, // Ankebut
  403: 30, // Rum
  410: 31, // Lokman
  414: 32, // Secde
  417: 33, // Ahzab
  427: 34, // Sebe
  433: 35, // Fatir
  439: 36, // Yasin
  445: 37, // Saffat
  452: 38, // Sad
  458: 39, // Zumer
  466: 40, // Mu'min (Gafir)
  476: 41, // Fussilet
  482: 42, // Şura
  488: 43, // Zuhruf
  495: 44, // Duhan
  498: 45, // Casiye
  501: 46, // Ahkaf
  506: 47, // Muhammed
  510: 48, // Fetih
  514: 49, // Hucurat
  517: 50, // Kaf
  520: 51, // Zariyat
  523: 52, // Tur
  526: 53, // Necm
  528: 54, // Kamer
  531: 55, // Rahman
  534: 56, // Vakia
  537: 57, // Hadid
  541: 58, // Mücadele
  545: 59, // Haşr
  548: 60, // Mumtehine
  551: 61, // Saf
  553: 62, // Cuma
  554: 63, // Munafikun
  556: 64, // Tegabun
  558: 65, // Talak
  560: 66, // Tahrim
  562: 67, // Mulk
  564: 68, // Kalem
  566: 69, // Hakka
  568: 70, // Mearic
  570: 71, // Nuh
  572: 72, // Cin
  574: 73, // Müzzemmil
  575: 74, // Müddessir
  577: 75, // Kıyame
  578: 76, // İnsan
  580: 77, // Murselat
  582: 78, // Nebe
  583: 79, // Naziat
  585: 80, // Abese
  586: 81, // Tekvir
  587: 82, // İnfitar - Mutaffifin aynı sayfa
  589: 84, // İnşikak
  590: 85, // Buruc
  591: 86, // Tarık - A'la aynı sayfa
  592: 88, // Gaşiye
  593: 89, // Fecr
  594: 90, // Beled
  595: 91, // Şems - Leyl aynı sayfa
  596: 93, // Duha - İnşirah aynı sayfa
  597: 95, // Tin - Alak aynı sayfa
  598: 97, // Kadr - Beyyine aynı sayfa
  599: 99, // Zilzal - Adiyat aynı sayfa
  600: 101, // Karia - Tekasür aynı sayfa
  601: 103, // Asr - Humeze - Fil aynı sayfa
  602: 106, // Kureyş - Maun - Kevser aynı sayfa
  603: 109, // Kafirun - Nasr - Tebbet aynı sayfa
  604: 112  // İhlas - Felak - Nas aynı sayfa
};

// HTML entity decode
function decodeEntities(text) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}

// HTTPS GET request with timeout
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
  let currentSurah = 2; // Default: Bakara
  for (const [page, surah] of Object.entries(SURAH_START_PAGES)) {
    if (parseInt(page) <= pageNo) {
      currentSurah = surah;
    }
  }
  return currentSurah;
}

// Sayfa içeriğini parse et
function parsePage(html, currentSurah) {
  const verses = [];
  const footnotes = {};

  // P etiketlerini çıkar
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match;

  while ((match = pRegex.exec(html)) !== null) {
    let text = match[1]
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    text = decodeEntities(text);

    if (text.length < 5) continue;

    // Ayet pattern: "1. metin" veya "1 . metin"
    const verseMatch = text.match(/^(\d+)\s*\.\s*([\s\S]+)$/);
    if (verseMatch) {
      const verseNo = parseInt(verseMatch[1]);
      let verseText = verseMatch[2].trim();

      // Dipnot referansını çıkar
      const fnRefMatch = verseText.match(/\((\d+)\)\s*$/);
      const footnoteRef = fnRefMatch ? parseInt(fnRefMatch[1]) : null;
      if (fnRefMatch) {
        verseText = verseText.replace(/\(\d+\)\s*$/, '').trim();
      }

      // Sure numarasını belirle
      // Eğer ayet numarası 1 ise ve önceki sayfada zaten ayet 1 varsa, yeni sure başlamış olabilir
      let surahNo = currentSurah;

      verses.push({
        surah: surahNo,
        verse: verseNo,
        text: verseText,
        footnoteRef
      });
      continue;
    }

    // Dipnot pattern: "1- açıklama"
    const fnMatch = text.match(/^(\d+)\s*[-–—]\s*([\s\S]+)$/);
    if (fnMatch) {
      const fnNo = parseInt(fnMatch[1]);
      footnotes[fnNo] = fnMatch[2].trim();
    }
  }

  return { verses, footnotes };
}

// Ana fonksiyon
async function main() {
  console.log('Hayrat Meal Scraper v4 (Sayfa Bazlı) başlatılıyor...\n');

  const outputDir = path.join(__dirname, '../src/data/quran');

  // Çıktı dizinini oluştur
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Kaç sayfa çekilecek?
  let maxPage = 50;
  if (process.argv.includes('--all')) {
    maxPage = 605;
  } else if (process.argv.includes('--test')) {
    maxPage = 10;
  }

  const allData = {
    metadata: {
      source: "Hayrat Neşriyat Meali",
      url: "https://kuran.hayrat.com.tr",
      type: "Turkish Quran Translation with Tafsir",
      scraped_at: new Date().toISOString(),
      total_pages: maxPage
    },
    translations: {},
    tafsir: {}
  };

  let totalVerses = 0;
  let totalFootnotes = 0;
  let lastSurah = 2;
  let lastVerse = 0;

  // Önce Fatiha'yı özel olarak çek
  console.log('Fatiha suresi çekiliyor...');
  try {
    const fatihaUrl = '/meal/sure/' + encodeURIComponent('1. FÂTİHA');
    const fatihaHtml = await fetchUrl(fatihaUrl);
    const fatihaResult = parsePage(fatihaHtml, 1);

    for (const v of fatihaResult.verses) {
      const key = `1:${v.verse}`;
      allData.translations[key] = v.text;
      totalVerses++;

      if (v.footnoteRef && fatihaResult.footnotes[v.footnoteRef]) {
        allData.tafsir[key] = fatihaResult.footnotes[v.footnoteRef];
        totalFootnotes++;
      }
    }
    console.log(`Fatiha: ${fatihaResult.verses.length} ayet çekildi\n`);
  } catch (err) {
    console.log(`Fatiha hatası: ${err.message}\n`);
  }

  // Sayfa bazlı çekim (Bakara'dan itibaren)
  for (let pageNo = 1; pageNo < maxPage; pageNo++) {
    const currentSurah = getSurahForPage(pageNo);

    // Yeni sure başladıysa bildir
    if (currentSurah !== lastSurah) {
      console.log(`\n--- Sure ${currentSurah} başladı ---`);
      lastSurah = currentSurah;
      lastVerse = 0;
    }

    process.stdout.write(`Sayfa ${pageNo}... `);

    try {
      const html = await fetchUrl(`/meal/sayfa?sayfaNo=${pageNo}`);
      const { verses, footnotes } = parsePage(html, currentSurah);

      let pageVerseCount = 0;
      for (const v of verses) {
        // Ayet numarasına göre sureyi belirle
        let surahNo = currentSurah;

        // Eğer ayet numarası 1 ise ve önceki ayet 1'den büyükse, yeni sure başlamış
        if (v.verse === 1 && lastVerse > 1) {
          surahNo = currentSurah;
        }

        const key = `${surahNo}:${v.verse}`;

        // Eğer bu ayet zaten varsa atla
        if (!allData.translations[key]) {
          allData.translations[key] = v.text;
          totalVerses++;
          pageVerseCount++;

          if (v.footnoteRef && footnotes[v.footnoteRef]) {
            allData.tafsir[key] = footnotes[v.footnoteRef];
            totalFootnotes++;
          }
        }

        lastVerse = v.verse;
      }

      console.log(`${pageVerseCount} ayet`);

      // Rate limiting - daha hızlı
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (err) {
      console.log(`HATA: ${err.message}`);
    }

    // Her 50 sayfada bir kaydet (backup)
    if (pageNo % 50 === 0) {
      const backupPath = path.join(outputDir, 'hayrat_meal_backup.json');
      fs.writeFileSync(backupPath, JSON.stringify(allData, null, 2), 'utf8');
      console.log(`\n[Backup kaydedildi: ${totalVerses} ayet]\n`);
    }
  }

  // JSON dosyasına kaydet
  const outputPath = path.join(outputDir, 'hayrat_meal.json');
  fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2), 'utf8');

  console.log(`\n========================================`);
  console.log(`Toplam ${totalVerses} ayet çekildi`);
  console.log(`Toplam ${totalFootnotes} dipnot çekildi`);
  console.log(`Kaydedildi: ${outputPath}`);
  console.log(`========================================`);
}

// Çalıştır
main().catch(err => {
  console.error('Kritik hata:', err);
  process.exit(1);
});
