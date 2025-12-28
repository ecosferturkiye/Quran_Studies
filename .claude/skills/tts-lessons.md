# TTS (Text-to-Speech) Lessons Learned

## Overview
Bu dosya, Flashcard bileşenine Arapça TTS (sesli okuma) özelliği ekleme sürecinde öğrenilen dersleri içerir.

## Denenen Çözümler ve Sonuçları

### 1. Web Speech API (SpeechSynthesis)
**Durum:** Başarısız
**Sorun:** Windows'ta varsayılan olarak Arapça TTS sesi yüklü değil.
```javascript
window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
```
**Sonuç:**
- `Speech started` ve `Speech ended` hemen art arda çağrılıyor
- `Arabic voice found: none` - sistem Arapça ses bulamıyor
- 23 ses mevcut ama hiçbiri Arapça değil

**Çözüm (Kullanıcı tarafında):**
1. Windows Settings > Time & Language > Language
2. Add a language > Arabic
3. Download speech pack

### 2. expo-speech (React Native)
**Durum:** Yüklendi ama web'de çalışmıyor
**Not:** expo-speech sadece iOS/Android'de çalışır, web için Web Speech API kullanılmalı
```bash
npx expo install expo-speech
```

### 3. Google Translate TTS
**Durum:** Başarısız - CORS hatası
```javascript
const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${text}&tl=ar&client=tw-ob`;
```
**Hata:** CORS policy tarafından engellendi

### 4. SoundOfText API
**Durum:** Başarısız - 400 Bad Request
```javascript
fetch('https://api.soundoftext.com/sounds', {
  method: 'POST',
  body: JSON.stringify({ engine: 'Google', data: { text, voice: 'ar-XA' } })
});
```
**Hata:** API 400 hatası döndürüyor

### 5. ResponsiveVoice.js
**Durum:** Başarısız - 403 Forbidden
```javascript
<script src="https://code.responsivevoice.org/responsivevoice.js?key=FREE"></script>
```
**Hata:** localhost'tan erişim engelleniyor (403 Forbidden)

## Çalışan Çözümler

### Microsoft Edge Tarayıcısı
Edge tarayıcısında Arapça TTS yerleşik olarak mevcut. Web Speech API Edge'de çalışır.

### Windows Arapça Dil Paketi
Windows'a Arapça dil paketi yüklenirse Web Speech API çalışır:
1. Settings > Time & Language > Language
2. Add Arabic language
3. Download speech pack

### Mobil (iOS/Android)
expo-speech paketi mobil cihazlarda çalışır:
```javascript
import * as Speech from 'expo-speech';
await Speech.speak(text, { language: 'ar-SA', rate: 0.7 });
```

## Öneriler

### Gelecekte TTS Eklenecekse:
1. **Kendi backend proxy'si:** Google TTS veya başka bir servis için CORS sorununu aşmak için backend proxy kullan
2. **Quran.com Word Audio:** Kur'an kelimeleri için quran.com'un kelime ses dosyalarını kullan (CORS yok)
3. **Ücretli API'ler:** Amazon Polly, Google Cloud TTS, Azure Cognitive Services (API key gerektirir)
4. **Pre-generated audio files:** Sık kullanılan kelimeler için önceden oluşturulmuş ses dosyaları

### Platform Kontrolü
```javascript
if (Platform.OS === 'ios' || Platform.OS === 'android') {
  // expo-speech kullan
} else if (Platform.OS === 'web') {
  // Web Speech API veya audio files kullan
}
```

## Sonuç
Web platformunda ücretsiz ve güvenilir Arapça TTS çözümü bulmak zor. En iyi yaklaşım:
1. Kullanıcıya Windows Arapça dil paketi yüklemesini önermek
2. Veya kendi backend'inizden ses dosyaları sunmak
3. Mobil için expo-speech kullanmak

## İlgili Dosyalar
- `src/components/learning/Flashcard.tsx` - Flashcard bileşeni
- `app/_layout.tsx` - Root layout (script injection için)
- `package.json` - expo-speech bağımlılığı (kaldırılabilir)
