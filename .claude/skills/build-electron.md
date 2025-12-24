# /build-electron

Electron masaüstü uygulamasını derler ve çalıştırır.

## Kullanım
```
/build-electron
/build-electron --build-only
/build-electron --run-only
```

## Talimatlar

### Tam Build & Run (varsayılan)

1. Web build oluştur:
   ```bash
   npm run build:web
   ```

2. Electron uygulamasını başlat:
   ```bash
   npm run electron
   ```

3. Başarılı çalıştığını doğrula:
   - Pencere açılmalı
   - `app://` protokolü ile yüklenmeli
   - Console hatası olmamalı

### Sadece Build (`--build-only`)

Web versiyonunu derle:
```bash
npm run build:web
```

Çıktı: `dist/` klasörü

### Sadece Çalıştır (`--run-only`)

Mevcut build ile Electron'u başlat:
```bash
npm run electron
```

## Electron Yapısı

```
electron/
├── main.js       # Ana süreç (BrowserWindow, protokol)
├── preload.js    # Preload script (IPC bridge)
└── icon.ico      # Uygulama ikonu
```

## Protokol

- `app://` custom protokolü kullanır
- `dist/` klasöründen dosya sunar
- Context isolation aktif (güvenlik)

## Sorun Giderme

### "Cannot find module" hatası
```bash
npm install
npm run build:web
```

### Beyaz ekran
- Console'u kontrol et (DevTools)
- dist/ klasörünün var olduğunu doğrula

### Port çakışması
- Expo dev server'ı durdur
- Electron'u yeniden başlat
