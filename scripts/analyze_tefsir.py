#!/usr/bin/env python3
"""
Analyze cached HTML to understand tefsir data structure.
"""

import json
import re
from pathlib import Path

CACHE_DIR = Path(__file__).parent / "cache_kuranyolu"

def analyze_file(filepath: Path):
    """Analyze a single HTML file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find MPageDmList
    match = re.search(r'MPageDmList\s*=\s*(\[.*?\]);', content, re.DOTALL)
    if not match:
        print(f"No MPageDmList found in {filepath.name}")
        return

    try:
        json_str = match.group(1)
        # Fix trailing commas
        json_str = re.sub(r',\s*}', '}', json_str)
        json_str = re.sub(r',\s*]', ']', json_str)

        data = json.loads(json_str)

        print(f"\n=== {filepath.name} ===")
        print(f"Pages in MPageDmList: {len(data)}")

        for i, page in enumerate(data[:2]):  # First 2 pages
            print(f"\nPage {i}:")
            print(f"  Keys: {list(page.keys())}")

            if 'TefsirList' in page and page['TefsirList']:
                print(f"  TefsirList count: {len(page['TefsirList'])}")
                for t in page['TefsirList'][:2]:  # First 2 tefsirs
                    print(f"    - AyetNumber: {t.get('AyetNumber')}")
                    text = t.get('AyetText', '')[:100] if t.get('AyetText') else 'None'
                    print(f"    - AyetText: {text}...")
            else:
                print("  TefsirList: Empty or None")

    except json.JSONDecodeError as e:
        print(f"JSON error: {e}")

if __name__ == "__main__":
    # Analyze first surah
    surah1 = CACHE_DIR / "surah_001.html"
    if surah1.exists():
        analyze_file(surah1)

    # Analyze a verse page
    verse_files = list(CACHE_DIR.glob("surah_002_verse_*.html"))
    if verse_files:
        analyze_file(verse_files[0])
