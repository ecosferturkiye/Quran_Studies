const fs = require('fs');
const path = require('path');

// Create a beautiful Quran-themed SVG icon
const svgIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2E7D32;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1B5E20;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="bookGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFD54F;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#FFC107;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="20" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Background Circle -->
  <circle cx="512" cy="512" r="480" fill="url(#bgGradient)" filter="url(#shadow)"/>

  <!-- Inner decorative circle -->
  <circle cx="512" cy="512" r="420" fill="none" stroke="#4CAF50" stroke-width="3" opacity="0.5"/>

  <!-- Book Base -->
  <g transform="translate(512, 512)">
    <!-- Left page -->
    <path d="M-180,-200 Q-200,-200 -200,-180 L-200,180 Q-200,200 -180,200 L-20,200 L-20,-200 Z"
          fill="#FFFDE7" stroke="#E0E0E0" stroke-width="2"/>

    <!-- Right page -->
    <path d="M180,-200 Q200,-200 200,-180 L200,180 Q200,200 180,200 L20,200 L20,-200 Z"
          fill="#FFF8E1" stroke="#E0E0E0" stroke-width="2"/>

    <!-- Book spine -->
    <rect x="-20" y="-200" width="40" height="400" fill="url(#bookGradient)" rx="5"/>

    <!-- Decorative lines on spine -->
    <line x1="-15" y1="-180" x2="-15" y2="180" stroke="#FFB300" stroke-width="2"/>
    <line x1="15" y1="-180" x2="15" y2="180" stroke="#FFB300" stroke-width="2"/>

    <!-- Arabic-style decorative element (simplified Bismillah pattern) -->
    <text x="0" y="-100" text-anchor="middle" font-family="Arial" font-size="48" fill="#1B5E20" font-weight="bold">
      ﷽
    </text>

    <!-- Quran text lines (left page) -->
    <line x1="-170" y1="-50" x2="-50" y2="-50" stroke="#9E9E9E" stroke-width="3" stroke-linecap="round"/>
    <line x1="-170" y1="0" x2="-50" y2="0" stroke="#9E9E9E" stroke-width="3" stroke-linecap="round"/>
    <line x1="-170" y1="50" x2="-50" y2="50" stroke="#9E9E9E" stroke-width="3" stroke-linecap="round"/>
    <line x1="-170" y1="100" x2="-80" y2="100" stroke="#9E9E9E" stroke-width="3" stroke-linecap="round"/>

    <!-- Quran text lines (right page) -->
    <line x1="50" y1="-50" x2="170" y2="-50" stroke="#9E9E9E" stroke-width="3" stroke-linecap="round"/>
    <line x1="50" y1="0" x2="170" y2="0" stroke="#9E9E9E" stroke-width="3" stroke-linecap="round"/>
    <line x1="50" y1="50" x2="170" y2="50" stroke="#9E9E9E" stroke-width="3" stroke-linecap="round"/>
    <line x1="80" y1="100" x2="170" y2="100" stroke="#9E9E9E" stroke-width="3" stroke-linecap="round"/>

    <!-- Star decoration -->
    <polygon points="0,130 5,145 20,145 8,155 13,170 0,160 -13,170 -8,155 -20,145 -5,145"
             fill="#FFD54F"/>
  </g>

  <!-- Outer decorative ring -->
  <circle cx="512" cy="512" r="500" fill="none" stroke="#81C784" stroke-width="4" opacity="0.3"/>
</svg>`;

// Save SVG
const svgPath = path.join(__dirname, '..', 'assets', 'quran-icon.svg');
fs.writeFileSync(svgPath, svgIcon);
console.log('SVG icon created at:', svgPath);

// Create a simple HTML to convert SVG to PNG (user can open in browser and save)
const htmlConverter = `<!DOCTYPE html>
<html>
<head>
  <title>Icon Converter</title>
</head>
<body style="background: #333; padding: 20px;">
  <h2 style="color: white;">Quran App Icon - Right-click and save as PNG</h2>
  <div style="display: flex; gap: 20px; flex-wrap: wrap;">
    <div>
      <h3 style="color: white;">1024x1024</h3>
      <img src="quran-icon.svg" width="1024" height="1024" id="icon1024">
    </div>
    <div>
      <h3 style="color: white;">256x256 (Preview)</h3>
      <img src="quran-icon.svg" width="256" height="256">
    </div>
  </div>
  <br>
  <canvas id="canvas" width="1024" height="1024" style="display:none;"></canvas>
  <button onclick="downloadPNG()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
    Download as PNG
  </button>
  <script>
    function downloadPNG() {
      const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');
      const img = document.getElementById('icon1024');
      ctx.drawImage(img, 0, 0, 1024, 1024);
      const link = document.createElement('a');
      link.download = 'icon.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  </script>
</body>
</html>`;

const htmlPath = path.join(__dirname, '..', 'assets', 'icon-converter.html');
fs.writeFileSync(htmlPath, htmlConverter);
console.log('HTML converter created at:', htmlPath);
console.log('\\nTo create PNG: Open icon-converter.html in browser and click Download');
