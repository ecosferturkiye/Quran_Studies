#!/usr/bin/env python3
"""
Merge Elmalılı Tefsir Data
- Use old backup (cleaner) as base
- Add missing surahs (67, 76, 80) from current
- Clean OCR artifacts from missing surahs
"""

import json
import re
from datetime import datetime

def clean_ocr_text(text):
    """Clean OCR artifacts from text."""
    if not text:
        return text

    # Remove page markers like "Sh14", "s. 123"
    text = re.sub(r'\bSh\d+\b', '', text)
    text = re.sub(r'\bs\.\s*\d+\b', '', text, flags=re.IGNORECASE)

    # Remove OCR garbage patterns
    # Pattern: "- -o s- 3" or "iL Syg N" or "- 10 8O AW" or "a a0 - w oo z"
    # These are lines with mostly non-Turkish characters

    # Remove inline garbage patterns (random sequences of letters/numbers/symbols)
    text = re.sub(r'\s+[a-z]\s+[a-z0-9]\s*-\s*[a-z]\s+[a-z0-9]+\s*-?\s*', ' ', text)
    text = re.sub(r'\s+[A-Z]{1,2}\s+[A-Z][a-z]?\s+[A-Z]\s+', ' ', text)

    # Remove lines that look like OCR garbage
    # (lines with lots of single chars, dashes, random symbols)
    lines = text.split('\n')
    cleaned_lines = []

    for line in lines:
        stripped = line.strip()

        # Skip empty lines but keep paragraph breaks
        if not stripped:
            if cleaned_lines and cleaned_lines[-1].strip():
                cleaned_lines.append('')
            continue

        # Count Turkish/valid letters vs garbage
        turkish_chars = 'abcçdefgğhıijklmnoöprsştuüvyzABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'
        valid_count = sum(1 for c in stripped if c in turkish_chars or c in ' .,;:!?\'"-()[]')

        # Skip lines that are mostly garbage
        if len(stripped) > 0:
            valid_ratio = valid_count / len(stripped)
            # Skip if less than 60% valid chars and line is short
            if valid_ratio < 0.6 and len(stripped) < 50:
                continue
            # Skip if less than 40% valid chars (definitely garbage)
            if valid_ratio < 0.4:
                continue

        # Skip lines that match common OCR garbage patterns
        if re.match(r'^[-\s\d\.oOaAwWzZ]{3,}$', stripped):
            continue
        if re.match(r'^[A-Z]{1,3}\s+[A-Z][a-z]?\s*$', stripped):
            continue

        cleaned_lines.append(line)

    text = '\n'.join(cleaned_lines)

    # Clean multiple dashes
    text = re.sub(r'-\s*-+', '-', text)

    # Clean orphan parentheses with garbage inside
    text = re.sub(r'\([^)]{0,5}\)', '', text)

    # Clean multiple spaces
    text = re.sub(r'  +', ' ', text)

    # Clean multiple newlines
    text = re.sub(r'\n{3,}', '\n\n', text)

    # Clean leading/trailing whitespace on lines
    text = '\n'.join(line.rstrip() for line in text.split('\n'))

    return text.strip()

def main():
    # Load both files
    print("Loading data files...")

    with open('src/data/quran/elmalili_tefsir_old_backup.json', 'r', encoding='utf-8') as f:
        old_data = json.load(f)

    with open('src/data/quran/elmalili_tefsir.json', 'r', encoding='utf-8') as f:
        current_data = json.load(f)

    # Start with old data (cleaner)
    merged = {
        "metadata": {
            "source": "Elmalılı Muhammed Hamdi Yazır - Hak Dini Kur'an Dili",
            "type": "Türkçe Tefsir",
            "merged_at": datetime.now().isoformat(),
            "note": "Merged from old backup (cleaner) with missing surahs from current"
        },
        "surahs": {}
    }

    # Copy old data (apply light cleaning)
    print("\nProcessing old backup surahs...")
    for surah_id, surah_data in old_data.get('surahs', {}).items():
        new_data = surah_data.copy()
        # Apply light cleaning to old data too
        original_len = len(new_data.get('tefsir', ''))
        new_data['tefsir'] = clean_ocr_text(new_data.get('tefsir', ''))
        cleaned_len = len(new_data['tefsir'])
        if original_len - cleaned_len > 100:
            print(f"  Surah {surah_id}: cleaned {original_len - cleaned_len:,} chars")
        merged['surahs'][surah_id] = new_data

    # Add missing surahs from current (67, 76, 80)
    missing = ['67', '76', '80']
    print(f"\nAdding missing surahs from current: {missing}")

    for surah_id in missing:
        if surah_id in current_data.get('surahs', {}):
            surah_data = current_data['surahs'][surah_id].copy()
            original_len = len(surah_data.get('tefsir', ''))

            # Clean the OCR text
            surah_data['tefsir'] = clean_ocr_text(surah_data.get('tefsir', ''))
            cleaned_len = len(surah_data['tefsir'])

            merged['surahs'][surah_id] = surah_data
            print(f"  Surah {surah_id}: {original_len:,} -> {cleaned_len:,} chars")

    # Verify all 114 surahs present
    all_surahs = set(str(i) for i in range(1, 115))
    present = set(merged['surahs'].keys())
    missing_final = all_surahs - present

    if missing_final:
        print(f"\nWARNING: Still missing surahs: {sorted(int(x) for x in missing_final)}")
    else:
        print(f"\nAll 114 surahs present!")

    # Calculate stats
    total_chars = sum(len(s.get('tefsir', '')) for s in merged['surahs'].values())
    print(f"Total characters: {total_chars:,}")

    # Save merged file
    output_path = 'src/data/quran/elmalili_tefsir_merged.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)

    print(f"\nSaved to: {output_path}")

    # Show sample from cleaned surah
    print("\n=== SAMPLE FROM CLEANED SURAH 67 ===")
    print(merged['surahs']['67']['tefsir'][:1000])

if __name__ == '__main__':
    main()
