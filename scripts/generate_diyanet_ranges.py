#!/usr/bin/env python3
"""
Generate Diyanet Turkish translation ranges JSON.
This file stores information about which verses share the same translation.
"""

import json
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR.parent / "src" / "data" / "quran"
OUTPUT_FILE = DATA_DIR / "diyanet_ranges.json"

def main():
    # Load Turkish translation
    with open(DATA_DIR / "quran_turkish.json", "r", encoding="utf-8") as f:
        turkish_data = json.load(f)

    ranges = {}

    for surah in turkish_data:
        surah_id = surah["id"]
        verses = surah["verses"]

        # Find consecutive verses with same translation
        i = 0
        while i < len(verses):
            current_translation = verses[i].get("translation", "")
            if not current_translation:
                i += 1
                continue

            # Find all consecutive verses with same translation
            group = [i]
            j = i + 1
            while j < len(verses):
                next_translation = verses[j].get("translation", "")
                if next_translation == current_translation:
                    group.append(j)
                    j += 1
                else:
                    break

            # If we found a group of 2+ verses with same translation
            if len(group) > 1:
                verse_nums = [verses[idx]["id"] for idx in group]
                start_verse = verse_nums[0]
                end_verse = verse_nums[-1]
                range_key = f"{surah_id}:{start_verse}-{end_verse}"

                # Store the range info
                ranges[range_key] = {
                    "surahId": surah_id,
                    "startVerse": start_verse,
                    "endVerse": end_verse,
                    "verseCount": len(verse_nums)
                }

            i = j if j > i else i + 1

    # Save to JSON
    output = {
        "metadata": {
            "description": "Diyanet Turkish translation verse ranges - where translator combined multiple verses",
            "total_ranges": len(ranges),
            "total_affected_verses": sum(r["verseCount"] for r in ranges.values())
        },
        "ranges": ranges
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Generated: {OUTPUT_FILE}")
    print(f"Total ranges: {len(ranges)}")
    print(f"Total affected verses: {sum(r['verseCount'] for r in ranges.values())}")

if __name__ == "__main__":
    main()
