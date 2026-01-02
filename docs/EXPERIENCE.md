# Next Linear Quran - Proje Tecrübesi

Bu dokümantasyon, projenin geliştirilmesi sırasında edinilen tecrübeleri, mimari kararları, karşılaşılan zorlukları ve çözümleri içerir.

---

## 1. Proje Özeti

**Amaç:** Kur'an okuma, dinleme ve Arapça öğrenme uygulaması

**Süre:** [Tarih eklenecek]

**Tech Stack:**
- React Native 0.81.5 + Expo 54.0.30
- TypeScript 5.9.2
- Zustand 5.0.9 (state management)
- Expo Router (file-based routing)

---

## 2. Mimari Kararlar

### 2.1 Hibrit Veri Stratejisi

**Karar:** Lokal JSON + Remote API kombinasyonu

**Gerekçe:**
- Offline kullanım için temel veriler lokal
- Zenginleştirilmiş veri (Elmalılı, metadata) API'den
- Kullanıcı deneyimi için hızlı yükleme

**Uygulama:**
```typescript
// quranService.ts
export async function fetchVersesByChapter(chapterId: number): Promise<Verse[]> {
  // 1. Lokal veriyi yükle (hızlı)
  const localVerses = await loadLocalVerses(chapterId);

  // 2. API'den zenginleştir (arka planda)
  const apiData = await fetchFromAPI(chapterId);

  // 3. Birleştir
  return mergeVerseData(localVerses, apiData);
}
```

**Öğrenilen:**
- API çağrılarını paralel yap (Promise.all)
- Fallback mekanizması zorunlu
- Cache stratejisi önemli

---

### 2.2 Kelime-Kelime Senkronizasyon

**Zorluk:** Audio pozisyonu ile kelime highlight senkronizasyonu

**Çözüm:** 50ms polling interval

**Uygulama:**
```typescript
// audioService.ts
const POLLING_INTERVAL = 50; // ms

function startPositionPolling(callback: (position: number) => void) {
  return setInterval(async () => {
    if (audioRef?.current) {
      const status = await audioRef.current.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        callback(status.positionMillis);
      }
    }
  }, POLLING_INTERVAL);
}
```

**Öğrenilen:**
- React Native'de audio pozisyonu için event listener yok
- Polling gerekli ama performans maliyeti var
- 50ms optimal - daha az latency, kabul edilebilir CPU

---

### 2.3 State Management

**Karar:** Zustand + AsyncStorage middleware

**Gerekçe:**
- Redux'a göre daha az boilerplate
- Built-in persist middleware
- TypeScript desteği mükemmel

**Pattern:**
```typescript
// stores/quranStore.ts
export const useQuranStore = create<QuranState>()(
  persist(
    (set, get) => ({
      currentPage: 1,
      bookmarks: [],

      addBookmark: (bookmark) => set((state) => ({
        bookmarks: [...state.bookmarks, bookmark]
      })),
    }),
    {
      name: 'quran-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

**Öğrenilen:**
- Persist için storage adapter şart
- Selector kullanımı performans için kritik
- State shape baştan iyi planlanmalı

---

### 2.4 Spaced Repetition (SM-2)

**Karar:** SM-2 algoritması

**Gerekçe:**
- Kanıtlanmış etkililik
- Basit implementasyon
- Anki ile uyumlu mantık

**Algoritma:**
```typescript
function calculateNextReview(card: CardProgress, rating: UserRating): CardProgress {
  const quality = RATING_QUALITY[rating]; // 0-5

  if (quality < 3) {
    // Başarısız - sıfırla
    return { ...card, repetitions: 0, interval: 1 };
  }

  // Başarılı
  let newInterval: number;
  if (card.repetitions === 0) newInterval = 1;
  else if (card.repetitions === 1) newInterval = 6;
  else newInterval = Math.round(card.interval * card.easeFactor);

  const newEF = Math.max(1.3,
    card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  return {
    ...card,
    repetitions: card.repetitions + 1,
    interval: newInterval,
    easeFactor: newEF,
  };
}
```

**Öğrenilen:**
- easeFactor minimum 1.3 olmalı
- İlk 2 tekrar sabit interval
- Mastery level kullanıcı motivasyonu için önemli

---

## 3. Veri Yapısı Tecrübeleri

### 3.1 Çeviri JSON Formatları

**Sorun:** Farklı kaynaklar farklı format kullanıyor

**Çözüm:** Adapter pattern

**Format 1 - Nested:**
```json
[
  {
    "id": 1,
    "name": "الفاتحة",
    "verses": [
      { "id": 1, "text": "...", "translation": "..." }
    ]
  }
]
```

**Format 2 - Flat:**
```json
{
  "1": {
    "1": "In the name of God...",
    "2": "Praise be to God..."
  }
}
```

**Adapter:**
```typescript
function normalizeTranslation(data: any, surah: number, ayah: number): string {
  // Flat format
  if (data[surah]?.[ayah]) {
    return data[surah][ayah];
  }

  // Nested format
  const surahData = data.find((s: any) => s.id === surah);
  const verse = surahData?.verses?.find((v: any) => v.id === ayah);
  return verse?.translation || verse?.text || "";
}
```

---

### 3.2 Word Timing Verisi

**Kaynak:** quran.com / quran-master projesi

**Yapı:**
```json
{
  "surahNumber": 1,
  "verses": [
    {
      "verseNumber": 1,
      "words": [
        {
          "arabic": "بِسْمِ",
          "tanzilClean": "بسم",
          "rootArabic": "سمو",
          "startTime": 0,
          "endTime": 450,
          "translations": {
            "en": "In the name",
            "tr": "Adıyla"
          }
        }
      ]
    }
  ]
}
```

**Öğrenilen:**
- startTime/endTime milliseconds
- Root bilgisi öğrenme için çok değerli
- Translations her kelime için gerekli

---

## 4. API Entegrasyonları

### 4.1 quran.com API

**Base URL:** `https://api.quran.com/api/v4`

**Kullanılan Endpointler:**
```
GET /verses/by_chapter/{chapter_id}
    ?translations=52,57      # Elmalılı, Transliteration
    &per_page=300
    &page=1

GET /recitations/{recitation_id}/by_chapter/{chapter_id}
```

**Rate Limit:** Yok (pratik kullanımda)

**Öğrenilen:**
- Translation ID'leri belgeli değil, deneyerek bul
- per_page max 300
- Transliteration ID: 57

### 4.2 Audio CDN

**URL Pattern:**
```
https://verses.quran.com/{recitation_id}/{surah_padded}{ayah_padded}.mp3

Örnek:
https://verses.quran.com/Mishari_Rashid_Alafasy/001001.mp3
```

**Reciters:**
| ID | İsim | Stil |
|----|------|------|
| 7 | Mishari al-Afasy | Murattal |
| 1 | AbdulBaset | Mujawwad |
| 2 | AbdulBaset | Murattal |
| 3 | As-Sudais | Murattal |
| 6 | Al-Husary | Murattal |

---

## 5. Zorluklar ve Çözümler

### 5.1 RTL Metin Rendering

**Sorun:** Arapça metin sağdan sola düzgün görünmüyor

**Çözüm:**
```typescript
const styles = StyleSheet.create({
  arabicText: {
    writingDirection: 'rtl',
    textAlign: 'right',
    fontFamily: 'Amiri', // Arabic font
  }
});
```

### 5.2 Audio Memory Leak

**Sorun:** Sayfa değişiminde audio çalmaya devam

**Çözüm:** Cleanup effect
```typescript
useEffect(() => {
  return () => {
    audioService.stopAudio();
    audioService.cleanup();
  };
}, []);
```

### 5.3 Large JSON Parse Performance

**Sorun:** 6000+ ayet yüklemede gecikme

**Çözüm:** Lazy loading per-surah
```typescript
// Tüm veriyi yükleme
const allVerses = await import('../data/quran_arabic.json');

// Sadece ihtiyaç duyulan sureyi yükle
const surahData = await import(`../data/quran-master/surah-${padded}.json`);
```

---

## 6. Performans Optimizasyonları

### 6.1 Memoization
```typescript
const MemoizedVerse = React.memo(VerseComponent, (prev, next) => {
  return prev.verse.id === next.verse.id &&
         prev.isHighlighted === next.isHighlighted;
});
```

### 6.2 FlatList Optimization
```typescript
<FlatList
  data={verses}
  renderItem={renderVerse}
  keyExtractor={(item) => item.verseKey}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews={true}
/>
```

### 6.3 Debounced Search
```typescript
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    performSearch(query);
  }, 300),
  []
);
```

---

## 7. Test Stratejisi

### Unit Tests
- Service fonksiyonları
- Store actions
- Utility fonksiyonları

### Integration Tests
- API entegrasyonu
- State persistence

### E2E Tests (önerilir)
- Surah navigasyonu
- Audio playback
- Learning session

---

## 8. Gelecek İyileştirmeler

### Kısa Vadeli
- [ ] Offline audio cache
- [ ] Push notification hatırlatmaları
- [ ] Bookmark sync (cloud)

### Orta Vadeli
- [ ] Tefsir entegrasyonu
- [ ] Sosyal özellikler (ilerleme paylaşımı)
- [ ] Gamification (rozet sistemi)

### Uzun Vadeli
- [ ] AI-powered öğrenme önerileri
- [ ] Telaffuz analizi
- [ ] Çoklu dil desteği genişletme

---

## 9. Kaynaklar

### API'ler
- [quran.com API](https://api.quran.com)
- [Tanzil.net](http://tanzil.net) - Kaynak Arapça metin

### Kütüphaneler
- [Expo AV](https://docs.expo.dev/versions/latest/sdk/av/) - Audio
- [Zustand](https://zustand-demo.pmnd.rs/) - State
- [i18next](https://www.i18next.com/) - Internationalization

### Tasarım
- [Islamic Pattern Generator](https://patternico.com)
- Arabic fonts: Amiri, Scheherazade

---

## 10. Ekip Notları

### Kod Stili
- TypeScript strict mode
- ESLint + Prettier
- Conventional commits

### Review Checklist
- [ ] TypeScript errors yok
- [ ] Console.log temizlendi
- [ ] Error handling var
- [ ] Loading states var
- [ ] Accessibility düşünüldü

---

*Son güncelleme: 2025-01-15*
