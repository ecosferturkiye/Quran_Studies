const { app, BrowserWindow, Menu, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');

let mainWindow;

// Özel protokol kaydı - app başlamadan önce çağrılmalı
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true, allowServiceWorkers: true, corsEnabled: true } }
]);

function createWindow() {
  // 'app://' protokolünü kaydet - dist klasöründen dosya servis eder
  protocol.handle('app', (request) => {
    const requestUrl = new URL(request.url);
    let filePath = requestUrl.pathname;

    // Windows için path düzeltmesi (leading slash kaldır)
    if (filePath.startsWith('/')) {
      filePath = filePath.substring(1);
    }

    // Boş path veya route path'leri için index.html döndür (SPA routing)
    // Sadece dosya uzantısı olan path'leri dosya olarak işle
    const hasFileExtension = /\.[^\/]+$/.test(filePath);
    if (filePath === '' || !hasFileExtension) {
      filePath = 'index.html';
    }

    const absolutePath = path.join(__dirname, '../dist', filePath);

    // Dosya yoksa index.html'e fallback (client-side routing için)
    if (!fs.existsSync(absolutePath)) {
      const indexPath = path.join(__dirname, '../dist', 'index.html');
      return net.fetch(url.pathToFileURL(indexPath).toString());
    }

    return net.fetch(url.pathToFileURL(absolutePath).toString());
  });

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'icon.ico'),
    title: 'NLQ',
    backgroundColor: '#1B5E20',
  });

  // Menü şablonu
  const menuTemplate = [
    {
      label: 'Dosya',
      submenu: [
        { role: 'quit', label: 'Çıkış' }
      ]
    },
    {
      label: 'Düzen',
      submenu: [
        { role: 'undo', label: 'Geri Al' },
        { role: 'redo', label: 'Yinele' },
        { type: 'separator' },
        { role: 'cut', label: 'Kes' },
        { role: 'copy', label: 'Kopyala' },
        { role: 'paste', label: 'Yapıştır' },
        { role: 'selectAll', label: 'Tümünü Seç' }
      ]
    },
    {
      label: 'Görünüm',
      submenu: [
        { role: 'reload', label: 'Yenile' },
        { role: 'forceReload', label: 'Zorla Yenile' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Varsayılan Yakınlaştırma' },
        { role: 'zoomIn', label: 'Yakınlaştır' },
        { role: 'zoomOut', label: 'Uzaklaştır' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Tam Ekran' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // Production'da app:// protokolü ile yükle - root path kullan
  mainWindow.loadURL('app://localhost/');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
