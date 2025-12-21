import json
import re
import os

# Parse Clear Quran OCR text file

raw_path = os.path.join(os.path.dirname(__file__), "clear_quran_raw.txt")

print("Reading raw file...")
with open(raw_path, "r", encoding="utf-8") as f:
    content = f.read()

# Total verses per surah
VERSE_COUNTS = {
    1: 7, 2: 286, 3: 200, 4: 176, 5: 120, 6: 165, 7: 206, 8: 75, 9: 129, 10: 109,
    11: 123, 12: 111, 13: 43, 14: 52, 15: 99, 16: 128, 17: 111, 18: 110, 19: 98, 20: 135,
    21: 112, 22: 78, 23: 118, 24: 64, 25: 77, 26: 227, 27: 93, 28: 88, 29: 69, 30: 60,
    31: 34, 32: 30, 33: 73, 34: 54, 35: 45, 36: 83, 37: 182, 38: 88, 39: 75, 40: 85,
    41: 54, 42: 53, 43: 89, 44: 59, 45: 37, 46: 35, 47: 38, 48: 29, 49: 18, 50: 45,
    51: 60, 52: 49, 53: 62, 54: 55, 55: 78, 56: 96, 57: 29, 58: 22, 59: 24, 60: 13,
    61: 14, 62: 11, 63: 11, 64: 18, 65: 12, 66: 12, 67: 30, 68: 52, 69: 52, 70: 44,
    71: 28, 72: 28, 73: 20, 74: 56, 75: 40, 76: 31, 77: 50, 78: 40, 79: 46, 80: 42,
    81: 29, 82: 19, 83: 36, 84: 25, 85: 22, 86: 17, 87: 19, 88: 26, 89: 30, 90: 20,
    91: 15, 92: 21, 93: 11, 94: 8, 95: 8, 96: 19, 97: 5, 98: 8, 99: 8, 100: 11,
    101: 11, 102: 8, 103: 3, 104: 9, 105: 5, 106: 4, 107: 7, 108: 3, 109: 6, 110: 3,
    111: 5, 112: 4, 113: 5, 114: 6
}

def extract_verses(text, expected_count):
    """Extract verses from text using numbered pattern."""
    verses = {}

    # Clean text - remove footnote markers
    text = re.sub(r'\[\d+\]', '', text)
    text = re.sub(r'\|\d+\|', '', text)
    text = re.sub(r'\!\d+\!', '', text)
    text = re.sub(r'\!\+', '', text)
    text = re.sub(r'\!', '', text)

    # Pattern: number followed by period, then text until next number-period
    pattern = r'(\d+)\.\s+'

    parts = re.split(pattern, text)

    i = 1
    while i < len(parts) - 1:
        try:
            verse_num = int(parts[i])
            verse_text = parts[i + 1].strip()

            # Clean up the text
            verse_text = re.sub(r'\s+', ' ', verse_text)
            verse_text = verse_text.strip()

            # Skip if too short or looks like a header
            if len(verse_text) > 5 and verse_num <= expected_count and verse_num not in verses:
                verses[verse_num] = verse_text
        except (ValueError, IndexError):
            pass
        i += 2

    return verses

def find_surah_content(content, surah_num):
    """Find the content section for a specific surah."""
    lines = content.split('\n')

    start_idx = None
    for i, line in enumerate(lines):
        if re.match(rf'^{surah_num}\.\s+\w', line.strip()):
            if i > 1000:  # Skip table of contents
                start_idx = i
                break

    if start_idx is None:
        return None

    end_idx = len(lines)
    next_surah = surah_num + 1
    for i in range(start_idx + 10, len(lines)):
        line = lines[i].strip()
        if re.match(rf'^{next_surah}\.\s+\w', line):
            end_idx = i
            break

    return '\n'.join(lines[start_idx:end_idx])

# Manual corrections for known OCR issues
MANUAL_VERSES = {
    1: {
        1: "In the Name of Allah—the Most Compassionate, Most Merciful.",
        2: "All praise is for Allah—Lord of all worlds,",
        3: "the Most Compassionate, Most Merciful,",
        4: "Master of the Day of Judgment.",
        5: "You alone we worship and You alone we ask for help.",
        6: "Guide us along the Straight Path,",
        7: "the Path of those You have blessed—not those You are displeased with, or those who are astray."
    }
}

# Parse each surah
all_translations = {}

print("Parsing surahs...")

for surah_num in range(1, 115):
    # Use manual corrections if available
    if surah_num in MANUAL_VERSES:
        all_translations[surah_num] = {str(k): v for k, v in MANUAL_VERSES[surah_num].items()}
        print(f"Surah {surah_num}: used manual corrections ({len(MANUAL_VERSES[surah_num])} verses)")
        continue

    surah_content = find_surah_content(content, surah_num)

    if surah_content:
        expected = VERSE_COUNTS.get(surah_num, 0)
        verses = extract_verses(surah_content, expected)

        if verses:
            all_translations[surah_num] = {str(k): v for k, v in verses.items()}
            status = "OK" if len(verses) >= expected * 0.9 else "PARTIAL"
            print(f"Surah {surah_num}: found {len(verses)}/{expected} verses [{status}]")
        else:
            print(f"Surah {surah_num}: NO VERSES FOUND")
    else:
        print(f"Surah {surah_num}: CONTENT NOT FOUND")

# Save result
output_path = os.path.join(os.path.dirname(__file__), "..", "src", "data", "quran", "quran_clearquran.json")

with open(output_path, "w", encoding="utf-8") as f:
    json.dump(all_translations, f, ensure_ascii=False, indent=2)

print(f"\nSaved to {output_path}")

# Show sample
if 1 in all_translations:
    print("\nSample (Fatiha):")
    for k, v in sorted(all_translations[1].items(), key=lambda x: int(x[0])):
        print(f"  {k}: {v}")

total_verses = sum(len(v) for v in all_translations.values())
print(f"\nTotal surahs: {len(all_translations)}")
print(f"Total verses: {total_verses}")
print(f"Coverage: {total_verses}/{sum(VERSE_COUNTS.values())} ({100*total_verses/sum(VERSE_COUNTS.values()):.1f}%)")
