# Next Linear Quran - Project Memory

## Project Overview
React Native/Expo ile geliştirilmiş Kur'an okuma, dinleme ve öğrenme uygulaması.

## Tech Stack
- **Framework:** React Native 0.81.5 + Expo 54.0.30 + Expo Router
- **Language:** TypeScript 5.9.2
- **State:** Zustand 5.0.9 + AsyncStorage (persistent)
- **i18n:** i18next + react-i18next

## Project Structure
```
app/                    # Expo Router screens (file-based routing)
├── (tabs)/
│   ├── quran/         # Surah listesi ve detay
│   ├── learn/         # Flashcard öğrenme modülü
│   ├── tefsir/        # Tefsir ekranları
│   └── settings/      # Ayarlar
src/
├── components/        # Reusable components (Magnifier, Flashcard...)
├── data/             # JSON veri dosyaları
│   ├── quran/        # Çeviriler ve tefsirler (arabic, turkish, english, haleem, clearquran, studyquran, kuranyolu_commentary)
│   ├── quran-master/ # Surah-by-surah word timing data (surah-001.json - surah-114.json)
│   └── learning/     # Kelime listeleri (words_300, twogram, threegram)
├── services/         # API ve veri servisleri
├── stores/           # Zustand state stores
├── hooks/            # Custom hooks (useAudioPlayer, useWordHighlight)
├── types/            # TypeScript type definitions
└── theme/            # Design system (colors, typography, spacing)
```

## Key Services

### quranService.ts
Hibrit veri servisi - lokal JSON + quran.com API
- `fetchVersesByChapter(chapterId)`: Tüm çevirileri birleştirir
- `getVersesOffline(chapterId)`: Offline fallback

### audioService.ts
Ses çalma motoru
- 6 kari seçeneği (Mishari, AbdulBaset, Sudais, Husary, Shatri)
- CDN: `https://verses.quran.com`
- 50ms polling ile word highlighting sync

### wordTimingService.ts
Kelime-kelime senkronizasyon
- `loadSurahWordData(surahId)`: Surah timing verisi
- `findCurrentWordIndex(words, playbackMs)`: Anlık kelime

### quranLocal.ts
Lokal JSON yükleyici - 8 çeviri destekler

## State Stores (Zustand)

### quranStore.ts
- currentPage, currentAyah, lastPlayed
- bookmarks, readingHistory
- downloadedJuz, downloadedSurahs

### learningStore.ts
- cardProgress (SM-2 algorithm)
- streak, todayReviewed, dailyGoal
- `getCardsForReview(category, limit)`: Due kartları

### settingsStore.ts
- theme, fontSize, languages
- playbackSpeed, repeatMode
- dailyGoal, hapticFeedback

## Translations Available
| Key | Language | Source |
|-----|----------|--------|
| translationTurkishDiyanet | Turkish | Diyanet İşleri |
| translationTurkishElmalili | Turkish | Elmalılı Hamdi Yazır |
| translationEnglish | English | Sahih International |
| translationHaleem | English | Abdel Haleem |
| translationClearQuran | English | Clear Quran |
| translationStudyQuran | English | Study Quran (Nasr) |
| commentaryStudyQuran | English | Study Quran Commentary |
| commentaryKuranYolu | Turkish | Kur'an Yolu Tefsiri (Diyanet) |
| translationHayrat | Turkish | Hayrat Neşriyat Meali |
| commentaryHayrat | Turkish | Risale-i Nur Külliyatı |

## Learning Module
SM-2 Spaced Repetition algoritması kullanır
- Kategoriler: words (300), twogram, threegram
- Ratings: again (0), hard (1), good (4), easy (5)
- Mastery levels: new → learning → reviewing → mastered

## External APIs
- `api.quran.com/api/v4/` - Elmalili, transliteration, metadata
- `verses.quran.com` - Audio CDN

## Key Patterns
- Hibrit caching (local + API)
- 50ms polling for word sync
- Persistent Zustand stores
- RTL Arabic support
- File-based routing (Expo Router)

## Commands
```bash
npm start              # Start dev server
npm run web           # Web version
npx expo start --web  # Web with Expo
```

## Common Tasks

### Yeni çeviri eklemek
1. `src/data/quran/quran_[name].json` oluştur
2. `quranLocal.ts`'de yükle
3. `quranService.ts`'de Verse interface'e ekle
4. UI'da toggle butonu ekle

### Yeni kari eklemek
1. `audioService.ts`'de RECITERS array'ine ekle
2. quran.com reciter ID'sini bul

### Yeni kelime seti eklemek
1. `src/data/learning/[name].json` oluştur
2. `LearningCategory` type'a ekle
3. Learn screen'de kategori kartı ekle

## File Locations
- Surah metadata: `src/data/surahs.ts`
- Word timings: `src/data/quran-master/surah-XXX.json`
- Translations: `src/data/quran/quran_*.json`
- Learning data: `src/data/learning/*.json`

## Type Definitions
```typescript
// Verse with all translations
interface Verse {
  id: number
  verseNumber: number
  verseKey: string              // "1:1"
  textArabic: string
  transliteration: string
  translationTurkishDiyanet: string
  translationTurkishElmalili: string
  translationEnglish: string
  translationHaleem: string
  translationClearQuran: string
  translationStudyQuran: string
  commentaryStudyQuran: string
  commentaryKuranYolu: string
  pageNumber: number
  juzNumber: number
}

// Word timing data
interface WordData {
  arabic: string
  tanzilClean: string
  root: string
  startTime: number    // ms
  endTime: number      // ms
  translations: Record<Language, string>
}
```

## Data Scrapers

### scripts/scrape_hayrat_v6.js (Active)
Page-based scraper with reference matching for Hayrat Neşriyat
- Source: `kulliyat.risale.online/meal/sayfa?sayfaNo={1-605}`
- Output: `src/data/quran/hayrat_meal.json`
- Features:
  - Scrapes all 605 pages
  - Matches `(n)` references in meal text to `n-` explanations
  - Rate limiting: 100ms between requests
  - Auto-backup every 50 pages
- Result: 5110 verses, 1202 tafsir entries

### scripts/fetch_kuranyolu.py
Diyanet Kur'an Yolu tefsiri scraper
- Source: `kuran.diyanet.gov.tr`
- Output: `src/data/quran/kuranyolu_commentary.json`
- Features: Range handling for merged verses

### scripts/fetch_studyquran.py
Study Quran translation scraper
- Output: `src/data/quran/quran_studyquran.json`

### scripts/parse_studyquran_commentary.py
OCR-based parser for Study Quran commentary
- Input: Scanned PDF pages
- Output: `src/data/quran/studyquran_commentary.json`
- Features: Range detection, footnote extraction

## Data Pipeline

```
Source Website/PDF
       │
       ▼
   Scraper (Node.js/Python)
       │
       ▼
   Raw JSON (with metadata)
       │
       ▼
   Parser/Cleaner
       │
       ├── HTML entity decode
       ├── Remove incomplete tags (</span, etc.)
       └── Reference matching
       │
       ▼
   Clean JSON (src/data/quran/*.json)
       │
       ▼
   Service Layer (quranLocal.ts, quranService.ts)
       │
       ▼
   UI Components (VerseCard, TefsirScreen)
```

### Reference Matching System (Hayrat)
Meal text contains numbered references like `(3)`, `(6)`, `(9)` that point to explanations:
- Meal: `"Rahmân ve Rahîm isimleri (3) (6) (9) ..."`
- Explanations: `"3- Bir açıklama...", "6- Başka bir açıklama..."`
- Output: Combined tafsir with all matching explanations

### Range Handling
Some tafsirs cover multiple verses (e.g., "2:1-5"). The system:
1. Stores under range key: `"2:1-5": "commentary..."`
2. Queries check both exact match and range match
3. Returns first match found

## Lessons Learned

### Web Scraping
1. **Page-based vs Sure-based**: Some sites structure content by page, not surah. Always analyze site structure first.
2. **Rate Limiting**: 100-200ms delays prevent IP blocks and are courteous to servers.
3. **Backup Strategy**: Save progress every N pages to prevent data loss on errors.
4. **Retry Failed Requests**: Track failed items and retry with longer timeouts.

### Data Cleaning
1. **HTML Entities**: Always decode `&nbsp;`, `&#x...;`, etc.
2. **Incomplete Tags**: Remove orphan `</span`, `</div>` with regex.
3. **Whitespace**: Normalize multiple spaces to single space.
4. **Turkish Characters**: Preserve İ, Ş, Ğ, Ü, Ö, Ç correctly (UTF-8).

### OCR Parsing
1. **Line Breaks**: OCR often breaks words incorrectly. Use heuristics to rejoin.
2. **Arabic Text**: May appear as RTL issues or garbled characters.
3. **Page Numbers**: Filter out page headers/footers.
4. **Footnotes**: Detect `*` or superscript numbers for footnote references.

### Reference Matching
1. **Same-page References**: `(n)` in text refers to `n-` on same page, not globally.
2. **Number Filtering**: Only match reasonable numbers (1-99), ignore large numbers like years.
3. **Multiple References**: A verse may have multiple references; collect all.

### Web TTS (Text-to-Speech)
1. **Web Speech API Limitation**: Windows'ta varsayılan Arapça TTS sesi yok. Kullanıcı dil paketi yüklemeli.
2. **CORS Issues**: Google Translate TTS, SoundOfText API gibi ücretsiz servisler CORS veya erişim kısıtlaması nedeniyle çalışmıyor.
3. **ResponsiveVoice**: localhost'tan 403 Forbidden hatası veriyor.
4. **expo-speech**: Sadece iOS/Android'de çalışır, web'de kullanılamaz.
5. **Çözüm Önerileri**:
   - Kullanıcıya Windows Arapça dil paketi yüklemesini öner
   - Edge tarayıcısı kullan (yerleşik Arapça TTS var)
   - Kendi backend proxy'si ile ses dosyaları sun
   - Quran.com kelime audio API'sini kullan (Kur'an kelimeleri için)
6. **Detaylı Dokümantasyon**: `.claude/skills/tts-lessons.md`

## Electron Desktop App

### Build Commands
```bash
npm run build:web      # Build web version
npm run electron       # Build and run Electron app
```

### Protocol
- Uses custom `app://` protocol
- Loads from `dist/` folder
- Security: Context isolation enabled

### File Structure
```
electron/
├── main.js           # Electron main process
├── preload.js        # Preload script
└── icon.ico          # App icon
dist/                 # Built web assets
```

## Agents

### Existing Agents (agents/)
| Agent | File | Purpose |
|-------|------|---------|
| Quran Agent | `quran_agent.py` | Kur'an okuma asistanı |
| Learning Agent | `learning_agent.py` | Kelime öğrenme |
| Audio Agent | `audio_agent.py` | Tilâvet/tecvid |
| Research Agent | `research_agent.py` | Araştırma |
| Tafsir Agent | `tafsir_agent.py` | Tefsir asistanı |
| Scraper Agent | `scraper_agent.py` | Data scraping |
| Validator Agent | `data_validator_agent.py` | Data quality |
| Build Agent | `build_agent.py` | Build & deploy |

## Skills

### Available Skills (.claude/skills/)
| Skill | Command | Purpose |
|-------|---------|---------|
| Project Info | `/project-info` | Show project details |
| Quran Verse | `/quran-verse` | Get verse with translations |
| Compare Translations | `/compare-translations` | Side-by-side comparison |
| Learn Vocab | `/learn-vocab` | Vocabulary flashcards |
| Quran Search | `/quran-search` | Search Quran text |
| Scrape Hayrat | `/scrape-hayrat` | Update Hayrat meal data |
| Build Electron | `/build-electron` | Build & run desktop app |
| Data Stats | `/data-stats` | Show data statistics |
| Compare Tafsir | `/compare-tafsir` | Compare tafsir sources |
| TTS Lessons | - | Web TTS implementation lessons (reference doc) |
