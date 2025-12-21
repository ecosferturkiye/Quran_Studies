# Quran Studies

A React Native Quran application with multiple translations, audio playback with word-by-word highlighting, and vocabulary learning features.

## Features

### Quran Reader
- **Arabic Text**: Full Quran with proper RTL display
- **6 Translations**:
  - Turkish: Diyanet (DIB), Elmalili Hamdi Yazir (EHY)
  - English: Sahih International (EN), Abdel Haleem (AH), Clear Quran (CQ), Study Quran (SQ)
- **Audio Playback**: Verse-by-verse recitation with word-by-word highlighting
- **Magnifier**: Displays current word during audio playback
- **Translation Toggles**: Show/hide any translation combination

### Learning Features
- Flashcard system for Quranic vocabulary
- Spaced repetition algorithm
- Word frequency data (300 most common words, 2-grams, 3-grams)

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **Language**: TypeScript
- **State Management**: Zustand
- **Styling**: React Native StyleSheet

## Project Structure

```
├── app/                    # Expo Router screens
│   ├── (tabs)/
│   │   ├── quran/         # Quran reader screens
│   │   ├── learn/         # Learning/flashcard screens
│   │   └── settings/      # App settings
├── src/
│   ├── components/        # Reusable components
│   ├── data/
│   │   ├── quran/         # Translation JSON files
│   │   └── learning/      # Vocabulary data
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API and data services
│   ├── stores/            # Zustand stores
│   ├── theme/             # Colors, typography, spacing
│   └── types/             # TypeScript types
├── scripts/               # Data parsing scripts
└── web/                   # Web build assets
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start
```

### Running the App

```bash
# Web
npm start -- --web

# iOS (requires macOS)
npm run ios

# Android
npm run android
```

## Data Sources

- **Arabic Text**: [Tanzil.net](https://tanzil.net) via quran-json
- **Turkish Translations**: Local JSON + quran.com API (Elmalili)
- **English Translations**:
  - Sahih International: quran-json
  - Abdel Haleem: quran.com API
  - Clear Quran: archive.org
  - Study Quran: fawazahmed0/quran-api

## Scripts

Python scripts for parsing translations from various sources:

```bash
# Fetch Abdel Haleem translation
python scripts/fetch_haleem.py

# Fetch Study Quran translation
python scripts/fetch_studyquran.py

# Parse Clear Quran from archive.org
python scripts/parse_clear_quran_final.py
```

## License

This project is for educational purposes. Quran translations are sourced from publicly available APIs and resources.

## Acknowledgments

- [quran.com](https://quran.com) - API for translations and audio
- [Tanzil.net](https://tanzil.net) - Quran text
- [fawazahmed0/quran-api](https://github.com/fawazahmed0/quran-api) - Multiple translations
- [archive.org](https://archive.org) - Clear Quran and Study Quran texts
