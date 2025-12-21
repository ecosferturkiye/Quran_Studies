import json
import re
import os

# Parse Study Quran from archive.org OCR text
# Format: verses marked with symbols (0, ©, ®, �) followed by text

raw_path = os.path.join(os.path.dirname(__file__), "study_quran_raw.txt")

print("Reading Study Quran file...")
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

# Surah names for finding sections
SURAH_NAMES = {
    1: "The Opening",
    2: "The Cow",
    3: "The House of.*Imran",
    4: "Women",
    5: "The Table Spread",
    6: "The Cattle",
    7: "The Heights",
    8: "The Spoils",
    9: "Repentance",
    10: "Jonah",
    11: "Hud",
    12: "Joseph",
    13: "The Thunder",
    14: "Abraham",
    15: "Hijr",
    16: "The Bee",
    17: "The Night Journey",
    18: "The Cave",
    19: "Mary",
    20: "Ta Ha",
    21: "The Prophets",
    22: "The Pilgrimage",
    23: "The Believers",
    24: "Light",
    25: "The Criterion",
    26: "The Poets",
    27: "The Ants",
    28: "The Story",
    29: "The Spider",
    30: "The Byzantines",
    31: "Luqman",
    32: "Prostration",
    33: "The Parties",
    34: "Sheba",
    35: "The Originator",
    36: "Ya Sin",
    37: "Those Ranged",
    38: "Sad",
    39: "The Throngs",
    40: "The Forgiver",
    41: "Expounded",
    42: "Counsel",
    43: "Gold Ornaments",
    44: "Smoke",
    45: "Upon Their Knees",
    46: "The Sand Dunes",
    47: "Muhammad",
    48: "Victory",
    49: "The Private Apartments",
    50: "Qaf",
    51: "The Scatterers",
    52: "The Mount",
    53: "The Star",
    54: "The Moon",
    55: "The Compassionate",
    56: "The Event",
    57: "Iron",
    58: "She Who Disputes",
    59: "The Gathering",
    60: "She Who Is Examined",
    61: "The Ranks",
    62: "The Congregational Prayer",
    63: "The Hypocrites",
    64: "Mutual Dispossession",
    65: "Divorce",
    66: "Prohibition",
    67: "Sovereignty",
    68: "The Pen",
    69: "The Inevitable",
    70: "The Stairways",
    71: "Noah",
    72: "The Jinn",
    73: "The Enwrapped",
    74: "The Enrobed",
    75: "The Resurrection",
    76: "Man",
    77: "Those Sent Forth",
    78: "The Tiding",
    79: "Those Who Pull Out",
    80: "He Frowned",
    81: "The Enfolding",
    82: "The Cleaving",
    83: "Those Who Stiff",
    84: "The Splitting",
    85: "The Constellations",
    86: "The Night Visitor",
    87: "The Most High",
    88: "The Overwhelming",
    89: "The Dawn",
    90: "The Land",
    91: "The Sun",
    92: "The Night",
    93: "The Morning Light",
    94: "Opening the Breast",
    95: "The Fig",
    96: "The Clot",
    97: "The Night of Power",
    98: "The Clear Proof",
    99: "The Earthquake",
    100: "Those That Run",
    101: "The Calamity",
    102: "Vying for More",
    103: "Time",
    104: "The Slanderer",
    105: "The Elephant",
    106: "Quraysh",
    107: "Assistance",
    108: "Abundance",
    109: "The Disbelievers",
    110: "Help",
    111: "Palm Fiber",
    112: "Sincerity",
    113: "The Dawn",
    114: "Mankind",
}


def find_surah_content(content, surah_num, min_pos=100000):
    """Find where a surah's verses start and end."""
    name_pattern = SURAH_NAMES.get(surah_num, "")
    if not name_pattern:
        return None, None

    # Find surah header
    for m in re.finditer(name_pattern, content[min_pos:], re.IGNORECASE):
        pos = min_pos + m.start()
        # Verify this is a surah header (followed by al-xxx)
        ctx = content[pos:pos + 200]
        if 'al-' in ctx.lower() or 'from the' in ctx.lower() or 'period' in ctx.lower():
            # Find where verses start (after intro, before Commentary)
            surah_text = content[pos:pos + 50000]

            # Find "In the Name of God" which precedes verses
            name_idx = surah_text.find("In the Name of God")
            if name_idx == -1:
                name_idx = surah_text.find("Alif")  # Some surahs start differently
            if name_idx == -1:
                name_idx = surah_text.find("0 ")  # Verse marker

            if name_idx > 0:
                verse_start = pos + name_idx
                # Find Commentary section (end of verses)
                commentary_idx = surah_text.find("\nCommentary\n", name_idx)
                if commentary_idx == -1:
                    commentary_idx = surah_text.find("\n\nCommentary", name_idx)
                if commentary_idx == -1:
                    commentary_idx = min(name_idx + 10000, len(surah_text))

                verse_end = pos + commentary_idx
                return verse_start, verse_end
            break

    return None, None


def extract_verses(text, expected_count):
    """Extract verses from Study Quran format."""
    verses = {}

    # Clean text
    text = re.sub(r'\s+', ' ', text)

    # The verses are marked with various symbols due to OCR
    # Split by verse markers: 0, ©, ®, �, O, etc.
    # Pattern: symbol followed by space and text
    pattern = r'[0O©®�]\s+'
    parts = re.split(pattern, text)

    verse_num = 0
    for part in parts:
        part = part.strip()
        if not part:
            continue

        # Skip if it looks like commentary (starts with number for verse reference)
        if re.match(r'^\d+\s+[A-Z]', part):
            continue

        verse_num += 1
        if verse_num <= expected_count:
            # Clean up the verse text
            # Remove footnote references like (Q), (IK), etc.
            verse_text = re.sub(r'\([A-Z]+\)', '', part)
            verse_text = re.sub(r'\s+', ' ', verse_text).strip()

            if len(verse_text) > 5:
                verses[verse_num] = verse_text

    return verses


# Manual verses for Fatiha (since we found them)
MANUAL_VERSES = {
    1: {
        1: "In the Name of God, the Compassionate, the Merciful.",
        2: "Praise be to God, Lord of the worlds,",
        3: "the Compassionate, the Merciful,",
        4: "Master of the Day of Judgment.",
        5: "Thee we worship and from Thee we seek help.",
        6: "Guide us upon the straight path,",
        7: "the path of those whom Thou hast blessed, not of those who incur wrath, nor of those who are astray."
    }
}

# Parse surahs
all_translations = {}

print("Parsing surahs...")

for surah_num in range(1, 115):
    expected = VERSE_COUNTS[surah_num]

    # Use manual verses if available
    if surah_num in MANUAL_VERSES:
        all_translations[surah_num] = {str(k): v for k, v in MANUAL_VERSES[surah_num].items()}
        print(f"Surah {surah_num}: {len(MANUAL_VERSES[surah_num])}/{expected} verses [MANUAL]")
        continue

    # Find surah content
    start, end = find_surah_content(content, surah_num)
    if start and end:
        surah_text = content[start:end]
        verses = extract_verses(surah_text, expected)

        if verses:
            all_translations[surah_num] = {str(k): v for k, v in verses.items()}
            found = len(verses)
            status = "OK" if found >= expected * 0.8 else "PARTIAL"
            print(f"Surah {surah_num}: {found}/{expected} verses [{status}]")
        else:
            print(f"Surah {surah_num}: NO VERSES EXTRACTED")
    else:
        print(f"Surah {surah_num}: CONTENT NOT FOUND")

# Save result
output_path = os.path.join(os.path.dirname(__file__), "..", "src", "data", "quran", "quran_studyquran.json")

final_data = {str(k): v for k, v in all_translations.items()}
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(final_data, f, ensure_ascii=False, indent=2)

print(f"\nSaved to {output_path}")

# Statistics
total_verses = sum(len(v) for v in final_data.values())
expected_total = sum(VERSE_COUNTS.values())
print(f"\nTotal surahs: {len(final_data)}")
print(f"Total verses: {total_verses}/{expected_total}")
print(f"Coverage: {100 * total_verses / expected_total:.1f}%")
