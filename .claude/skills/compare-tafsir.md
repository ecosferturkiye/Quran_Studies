# /compare-tafsir

Farklı tefsir kaynaklarını karşılaştırır.

## Kullanım
```
/compare-tafsir 2:255
/compare-tafsir 1:1-7
/compare-tafsir --sources
```

## Talimatlar

### Ayet Karşılaştırma (varsayılan)

Belirtilen ayet için tüm tefsir kaynaklarını göster:

1. Study Quran Commentary (İngilizce)
2. Kur'an Yolu Tefsiri (Türkçe, Diyanet)
3. Hayrat / Risale-i Nur (Türkçe)

### Sure:Ayet Formatı

Örnek: `/compare-tafsir 2:255` (Ayetel Kürsi)

```javascript
const studyquran = require('./src/data/quran/studyquran_commentary.json');
const kuranyolu = require('./src/data/quran/kuranyolu_commentary.json');
const hayrat = require('./src/data/quran/hayrat_meal.json');

const key = "2:255";
console.log("Study Quran:", studyquran[key]);
console.log("Kur'an Yolu:", kuranyolu[key] || kuranyolu["2:255-257"]);
console.log("Hayrat:", hayrat.tafsir[key]);
```

### Range Handling

Bazı tefsirler ayet gruplarını kapsar:
- Kur'an Yolu: `"2:1-5": "tefsir..."`
- Study Quran: Bazen birleşik

Range kontrolü:
```javascript
function findCommentary(data, surah, verse) {
  const exactKey = `${surah}:${verse}`;
  if (data[exactKey]) return data[exactKey];

  // Range ara
  for (const key of Object.keys(data)) {
    if (key.includes('-')) {
      const [s, range] = key.split(':');
      if (parseInt(s) !== surah) continue;
      const [start, end] = range.split('-').map(Number);
      if (verse >= start && verse <= end) return data[key];
    }
  }
  return null;
}
```

### Kaynakları Listele (`--sources`)

Mevcut tefsir kaynakları:

| Kaynak | Dil | Dosya |
|--------|-----|-------|
| Study Quran | EN | studyquran_commentary.json |
| Kur'an Yolu | TR | kuranyolu_commentary.json |
| Hayrat | TR | hayrat_meal.json (tafsir) |

## Notlar

- Study Quran: Akademik, karşılaştırmalı analiz
- Kur'an Yolu: Diyanet onaylı, geleneksel
- Hayrat: Risale-i Nur referansları
