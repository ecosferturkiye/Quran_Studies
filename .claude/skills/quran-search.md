# /quran-search

Kur'an'da anahtar kelime araması yapar.

## Kullanım
```
/quran-search mercy
/quran-search rahmet
/quran-search "Allah'a ibadet"
```

## Talimatlar

Kullanıcı bir arama terimi verdiğinde:

1. `src/data/quran/` klasöründeki JSON dosyalarında ara:
   - quran_arabic.json (Arapça metin)
   - quran_turkish.json (Türkçe Diyanet)
   - quran_english.json (İngilizce Sahih)

2. Arama sonuçlarını şu formatta göster:
   ```
   ## Arama: "{terim}"

   Bulunan: X ayet

   ### 1. [Sure:Ayet]
   📖 Arapça: ...
   🇹🇷 Türkçe: ...
   🇬🇧 İngilizce: ...

   ### 2. [Sure:Ayet]
   ...
   ```

3. Maksimum 10 sonuç göster

4. Eğer sonuç bulunamazsa, benzer terimleri öner
