const fs = require('fs');
const path = require('path');

async function createIco() {
  const pngToIco = (await import('png-to-ico')).default;

  const assetsDir = path.join(__dirname, '..', 'assets');

  // Use multiple sizes for ICO
  const pngFiles = [
    path.join(assetsDir, 'icon-256.png'),
    path.join(assetsDir, 'icon-128.png'),
    path.join(assetsDir, 'icon-64.png'),
    path.join(assetsDir, 'icon-48.png'),
    path.join(assetsDir, 'icon-32.png'),
    path.join(assetsDir, 'icon-16.png')
  ];

  try {
    const buf = await pngToIco(pngFiles);

    // Save to release folder
    const icoPath = path.join(__dirname, '..', 'release', '.icon-ico', 'icon.ico');
    fs.writeFileSync(icoPath, buf);
    console.log('Created:', icoPath);

    // Also save to electron folder
    const electronIcoPath = path.join(__dirname, '..', 'electron', 'icon.ico');
    fs.writeFileSync(electronIcoPath, buf);
    console.log('Created:', electronIcoPath);

    console.log('\nICO files created successfully!');
  } catch (err) {
    console.error('Error creating ICO:', err);
  }
}

createIco();
