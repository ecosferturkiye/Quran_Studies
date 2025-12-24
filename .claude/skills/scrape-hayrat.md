# /scrape-hayrat

Hayrat Neşriyat mealini ve tefsirini günceller.

## Kullanım
```
/scrape-hayrat
/scrape-hayrat --test
/scrape-hayrat --check
```

## Talimatlar

### Tam Scraping (varsayılan)

1. `scripts/scrape_hayrat_v6.js` scriptini çalıştır:
   ```bash
   node scripts/scrape_hayrat_v6.js
   ```

2. Scriptin özelliklerini açıkla:
   - 605 sayfa çeker (kulliyat.risale.online)
   - Meal içindeki (n) referanslarını n- açıklamalarla eşleştirir
   - 100ms rate limiting
   - Her 50 sayfada backup

3. Çıktı: `src/data/quran/hayrat_meal.json`

### Test Modu (`--test`)

İlk 5 sayfayı test et:
```bash
node scripts/scrape_hayrat_v6.js --test
```

### Veri Kontrolü (`--check`)

Mevcut hayrat_meal.json verilerini kontrol et:
1. Toplam çeviri sayısı (beklenen: ~5110)
2. Toplam tefsir sayısı (beklenen: ~1202)
3. HTML artıklarını kontrol et (</span vb.)

```javascript
const data = require('./src/data/quran/hayrat_meal.json');
console.log('Translations:', Object.keys(data.translations).length);
console.log('Tafsir:', Object.keys(data.tafsir).length);
```

## Referans Eşleştirme Mantığı

Meal metni: `"Allah'ın ismiyle. (2) (5) (9)"`

Bu numaralar aynı sayfadaki açıklamalara işaret eder:
- `2- Besmele hakkında açıklama...`
- `5- Risale-i Nur referansı...`
- `9- Başka bir açıklama...`

Scraper bu eşleştirmeyi otomatik yapar.

## Kaynak

- Web: https://kuran.hayrat.com.tr
- API: https://kulliyat.risale.online/meal/sayfa?sayfaNo={1-605}
