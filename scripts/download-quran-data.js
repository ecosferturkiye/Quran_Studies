const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data', 'quran');

const FILES = [
  {
    url: 'https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/quran.json',
    filename: 'quran_arabic.json',
    description: 'Arabic Text'
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/quran_tr.json',
    filename: 'quran_turkish.json',
    description: 'Turkish Translation (Diyanet)'
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/quran_en.json',
    filename: 'quran_english.json',
    description: 'English Translation'
  }
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        https.get(response.headers.location, (redirectResponse) => {
          redirectResponse.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  // Create data directory if it doesn't exist
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  console.log('Downloading Quran data from quran-json...\n');

  for (const file of FILES) {
    const dest = path.join(DATA_DIR, file.filename);
    console.log(`Downloading ${file.description}...`);
    try {
      await downloadFile(file.url, dest);
      console.log(`  ✓ Saved to ${file.filename}`);
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}`);
    }
  }

  console.log('\nDone!');
}

main();
