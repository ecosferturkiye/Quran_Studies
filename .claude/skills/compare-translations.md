# /compare-translations

Bir ayetin farklı çevirilerini karşılaştırır.

## Kullanım
```
/compare-translations 2:255
/compare-translations 112:1-4
```

## Talimatlar

1. Ayet(ler)i belirle

2. Tüm çevirileri yükle:
   - Diyanet (TR)
   - Elmalılı (TR) - varsa
   - Sahih International (EN)
   - Abdel Haleem (EN)
   - Clear Quran (EN)
   - Study Quran (EN)

3. Karşılaştırma tablosu oluştur:

   ```
   ## Çeviri Karşılaştırması: {surah}:{ayah}

   ### Arapça Metin
   {arabic}

   ---

   ### Türkçe Çeviriler

   | Kaynak | Çeviri |
   |--------|--------|
   | Diyanet | ... |
   | Elmalılı | ... |

   ### İngilizce Çeviriler

   | Kaynak | Çeviri |
   |--------|--------|
   | Sahih | ... |
   | Haleem | ... |
   | Clear Quran | ... |
   | Study Quran | ... |

   ---

   ### Analiz

   **Farklılıklar:**
   - X kelimesi farklı çevrilmiş: A vs B
   - Y ifadesi şu şekilde yorumlanmış: ...

   **Ortak Tema:**
   - Tüm çeviriler şu mesajı veriyor: ...
   ```

4. Çeviriler arasındaki önemli farkları vurgula
5. Akademik ve objektif ol
