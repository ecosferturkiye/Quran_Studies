#!/usr/bin/env python3
"""
Find verses where Arabic text is different but Turkish translation is the same.
This happens when the translator combined multiple verses into one sentence.
"""

import json
from pathlib import Path
from collections import defaultdict

SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR.parent / "src" / "data" / "quran"

def main():
    # Load Turkish translation
    with open(DATA_DIR / "quran_turkish.json", "r", encoding="utf-8") as f:
        turkish_data = json.load(f)

    # Load Arabic text
    with open(DATA_DIR / "quran_arabic.json", "r", encoding="utf-8") as f:
        arabic_data = json.load(f)

    print("=" * 70)
    print("Aynı Türkçe Meale Sahip Farklı Ayetler")
    print("=" * 70)

    duplicates = []

    for surah in turkish_data:
        surah_id = surah["id"]
        surah_name = surah["transliteration"]
        verses = surah["verses"]

        # Find Arabic surah
        arabic_surah = next((s for s in arabic_data if s["id"] == surah_id), None)
        if not arabic_surah:
            continue

        # Group consecutive verses with same translation
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
                arabic_texts = [arabic_surah["verses"][idx]["text"] for idx in group]

                # Verify Arabic texts are actually different
                if len(set(arabic_texts)) > 1:  # Different Arabic texts
                    duplicates.append({
                        "surah_id": surah_id,
                        "surah_name": surah_name,
                        "verses": verse_nums,
                        "translation": current_translation[:100] + "..." if len(current_translation) > 100 else current_translation,
                        "arabic_count": len(set(arabic_texts))
                    })

            i = j if j > i else i + 1

    # Print results
    total_affected = 0
    for dup in duplicates:
        verse_range = f"{dup['verses'][0]}-{dup['verses'][-1]}" if len(dup['verses']) > 1 else str(dup['verses'][0])
        print(f"\n{dup['surah_id']}. {dup['surah_name']} - Ayet {verse_range}")
        print(f"  Etkilenen ayet sayısı: {len(dup['verses'])}")
        print(f"  Meal: {dup['translation']}")
        total_affected += len(dup['verses'])

    print("\n" + "=" * 70)
    print(f"ÖZET:")
    print(f"  Toplam grup sayısı: {len(duplicates)}")
    print(f"  Etkilenen toplam ayet: {total_affected}")
    print("=" * 70)

    # Save to JSON for further processing
    output = {
        "description": "Verses with identical Turkish translations but different Arabic texts",
        "total_groups": len(duplicates),
        "total_affected_verses": total_affected,
        "duplicates": duplicates
    }

    with open(SCRIPT_DIR / "meal_duplicates.json", "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\nSonuçlar kaydedildi: {SCRIPT_DIR / 'meal_duplicates.json'}")

if __name__ == "__main__":
    main()
