# /learn-vocab

Kur'an Arapçası kelime öğrenme yardımcısı.

## Kullanım
```
/learn-vocab               # Rastgele 10 kelime göster
/learn-vocab 20            # 20 kelime göster
/learn-vocab twogram       # 2'li kelime grupları
/learn-vocab threegram     # 3'lü kelime grupları
```

## Talimatlar

1. Kategori belirle:
   - Varsayılan: `src/data/learning/words_300.json` (en sık 300 kelime)
   - twogram: `src/data/learning/twogram.json`
   - threegram: `src/data/learning/threegram.json`

2. Rastgele kelimeler seç ve şu formatta göster:

   ```
   ## Kur'an Kelime Çalışması

   ### 1. {arabic}
   - 🇹🇷 Türkçe: {tr}
   - 🇬🇧 İngilizce: {en}
   - 📊 Frekans: {frequency}

   ### 2. {arabic}
   ...
   ```

3. Her kelime için:
   - Arapça yazılış
   - Türkçe ve İngilizce çeviri
   - Kur'an'daki kullanım sıklığı

4. Sonda öğrenme ipucu ver:
   ```
   💡 İpucu: Bu kelimeleri günde 3 kez tekrar ederseniz,
   bir hafta içinde kalıcı olarak öğrenirsiniz.
   ```
