# /data-stats

Proje veri istatistiklerini gösterir.

## Kullanım
```
/data-stats
/data-stats translations
/data-stats tafsir
/data-stats learning
```

## Talimatlar

### Genel İstatistikler (varsayılan)

Tüm veri kaynaklarını analiz et ve rapor hazırla:

```javascript
// Çevirileri say
const turkish = require('./src/data/quran/quran_turkish.json');
const elmalili = require('./src/data/quran/quran_elmalili.json');
const english = require('./src/data/quran/quran_english.json');
const haleem = require('./src/data/quran/quran_haleem.json');
const clearquran = require('./src/data/quran/quran_clearquran.json');
const studyquran = require('./src/data/quran/quran_studyquran.json');
const hayrat = require('./src/data/quran/hayrat_meal.json');

// Tefsirleri say
const kuranyolu = require('./src/data/quran/kuranyolu_commentary.json');
const studyquranComm = require('./src/data/quran/studyquran_commentary.json');
```

### Çeviri İstatistikleri (`translations`)

Her çeviri kaynağı için:
- Toplam ayet sayısı
- Eksik ayetler
- Ortalama kelime sayısı

### Tefsir İstatistikleri (`tafsir`)

Her tefsir kaynağı için:
- Toplam tefsir sayısı
- Ayet kapsamı (% coverage)
- Range handling sayısı

### Öğrenme Verileri (`learning`)

Kelime setleri:
- words_300: 300 en sık kelime
- twogram: 2'li kelime grupları
- threegram: 3'lü kelime grupları

## Beklenen Değerler

| Kaynak | Ayet | Tefsir |
|--------|------|--------|
| Turkish (Diyanet) | 6236 | - |
| Elmalili | 6236 | - |
| English (Sahih) | 6236 | - |
| Haleem | 6236 | - |
| ClearQuran | 6236 | - |
| StudyQuran | 6236 | ~2000 |
| Hayrat | 5110 | 1202 |
| Kur'an Yolu | - | ~6000 |
