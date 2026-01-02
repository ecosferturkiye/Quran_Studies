const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'assets', 'quran-icon.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

// Generate different sizes
const sizes = [1024, 512, 256, 128, 64, 48, 32, 16];

sizes.forEach(size => {
  const resvg = new Resvg(svgContent, {
    fitTo: {
      mode: 'width',
      value: size
    }
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  const outputPath = path.join(__dirname, '..', 'assets', `icon-${size}.png`);
  fs.writeFileSync(outputPath, pngBuffer);
  console.log(`Created: icon-${size}.png`);
});

// Copy 1024 as main icon.png
const mainIconSrc = path.join(__dirname, '..', 'assets', 'icon-1024.png');
const mainIconDst = path.join(__dirname, '..', 'assets', 'icon.png');
fs.copyFileSync(mainIconSrc, mainIconDst);
console.log('Copied to icon.png');

// Also copy for adaptive-icon and splash
fs.copyFileSync(mainIconSrc, path.join(__dirname, '..', 'assets', 'adaptive-icon.png'));
fs.copyFileSync(mainIconSrc, path.join(__dirname, '..', 'assets', 'splash-icon.png'));
console.log('Updated adaptive-icon.png and splash-icon.png');

console.log('\nIcon generation complete!');
