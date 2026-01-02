# /project-info

Next Linear Quran projesi hakkında bilgi verir.

## Kullanım
```
/project-info
/project-info services
/project-info data
```

## Talimatlar

### Genel Bilgi (varsayılan)

Projenin genel yapısını açıkla:
- Tech stack: React Native + Expo + TypeScript
- State: Zustand + AsyncStorage
- Routing: Expo Router (file-based)

### Services (`/project-info services`)

Servisleri açıkla:
1. **quranService.ts** - Hibrit veri servisi (lokal + API)
2. **audioService.ts** - Ses çalma motoru (6 kari)
3. **wordTimingService.ts** - Kelime senkronizasyonu
4. **quranLocal.ts** - Lokal JSON yükleyici

### Data (`/project-info data`)

Veri yapısını açıkla:
- `src/data/quran/` - 8 çeviri JSON
- `src/data/quran-master/` - 114 surah timing verisi
- `src/data/learning/` - Kelime listeleri

### Stores

Zustand store'larını açıkla:
- quranStore (okuma durumu, bookmarks)
- learningStore (SM-2 ilerleme)
- settingsStore (kullanıcı ayarları)

### Hooks

Custom hook'ları açıkla:
- useAudioPlayer - Ses kontrolü
- useWordHighlight - Kelime vurgulama

CLAUDE.md dosyasından detaylı bilgi al.
