# /quran-verse

Belirli bir ayeti tüm çevirileriyle birlikte getirir.

## Kullanım
```
/quran-verse 1:1
/quran-verse 2:255
/quran-verse Fatiha 1
```

## Talimatlar

1. Kullanıcının verdiği ayet referansını parse et:
   - "1:1" formatı → Surah 1, Ayet 1
   - "Fatiha 1" formatı → Sure adından numarayı bul

2. Aşağıdaki dosyalardan veriyi oku:
   - `src/data/quran/quran_arabic.json`
   - `src/data/quran/quran_turkish.json`
   - `src/data/quran/quran_english.json`
   - `src/data/quran/quran_haleem.json`
   - `src/data/quran/quran_clearquran.json`
   - `src/data/quran/quran_studyquran.json`

3. Çıktı formatı:
   ```
   ## Ayet {surah}:{ayah}

   ### Arapça
   {arabic_text}

   ### Çeviriler

   **Diyanet (TR):**
   {turkish_diyanet}

   **Sahih International (EN):**
   {english_sahih}

   **Abdel Haleem (EN):**
   {haleem}

   **Clear Quran (EN):**
   {clearquran}

   **Study Quran (EN):**
   {studyquran}
   ```

4. Kelime kelime analiz için `src/data/quran-master/surah-XXX.json` dosyasından timing verisi al
