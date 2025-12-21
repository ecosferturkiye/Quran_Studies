import json
import re
import os

# Final Clear Quran parser - merges multiple sources and handles edge cases

print("Reading source files...")

# Read alternative source
alt_path = os.path.join(os.path.dirname(__file__), "clear_quran_alt.txt")
with open(alt_path, "r", encoding="utf-8") as f:
    alt_content = f.read()

# Read original source (if exists)
raw_path = os.path.join(os.path.dirname(__file__), "clear_quran_raw.txt")
raw_content = ""
if os.path.exists(raw_path):
    with open(raw_path, "r", encoding="utf-8") as f:
        raw_content = f.read()

# Load existing parsed data to merge
existing_path = os.path.join(os.path.dirname(__file__), "..", "src", "data", "quran", "quran_clearquran.json")
existing_data = {}
if os.path.exists(existing_path):
    with open(existing_path, "r", encoding="utf-8") as f:
        existing_data = json.load(f)

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

# Known start positions in alt_content for problematic surahs
KNOWN_POSITIONS = {
    3: 113885,    # Ali-Imran
    51: 883643,   # Scattering Winds
    54: 900176,   # The Moon
    58: 925585,   # Pleading Woman
    74: 992659,   # One Covered Up
    82: 1017483,  # Sky Splitting Open
    86: 1025727,  # Nightly Star
    103: 1047124, # Passage of Time
    108: 1050743, # Abundant Goodness
    109: 1051526, # The Disbelievers
    110: 1052275, # The Ultimate Help
    111: 1053011, # Palm Fibre
    112: 1053679, # Purity of Faith
    113: 1054233, # The Daybreak
    114: 1054765, # Humankind
}

# Known end positions for surahs where auto-detection fails
KNOWN_END_POSITIONS = {
    54: 905807,   # The Moon ends before Ar-Rahman
}

# Surah name patterns
SURAH_PATTERNS = {
    1: [r"The Opening", r"Al-Fatihah"],
    2: [r"The Cow", r"Al-Baqarah"],
    3: [r"Ali-?.?Imran", r"Family of Imran"],
    4: [r"Women", r"An-Nisa"],
    5: [r"Spread Table", r"Al-Ma.?idah"],
    6: [r"Cattle", r"Al-An.?am"],
    7: [r"The Heights", r"Al-A.?raf"],
    8: [r"Spoils of War", r"Al-Anfal"],
    9: [r"Repentance", r"At-Tawbah"],
    10: [r"Jonah", r"Yunus"],
    11: [r"H.?d"],
    12: [r"Joseph", r"Yusuf"],
    13: [r"Thunder", r"Ar-Ra.?d"],
    14: [r"Abraham", r"Ibrahim"],
    15: [r"Stone Valley", r"Al-Hijr"],
    16: [r"Bees", r"An-Nahl"],
    17: [r"Night Journey", r"Al-Isra"],
    18: [r"The Cave", r"Al-Kahf"],
    19: [r"Mary", r"Maryam"],
    20: [r"Ta-Ha", r"Taha"],
    21: [r"Prophets", r"Al-Anbiya"],
    22: [r"Pilgrimage", r"Al-Hajj"],
    23: [r"Believers", r"Al-Mu.?min"],
    24: [r"The Light", r"An-Nur"],
    25: [r"Standard", r"Al-Furqan"],
    26: [r"Poets", r"Ash-Shu.?ara"],
    27: [r"The Ants", r"An-Naml"],
    28: [r"Whole Story", r"Al-Qasas"],
    29: [r"Spider", r"Al-Ankabut"],
    30: [r"Romans", r"Ar-Rum"],
    31: [r"Luqman", r"Lugman"],
    32: [r"Prostration", r"As-Sajdah"],
    33: [r"Enemy Alliance", r"Al-Ahzab"],
    34: [r"Sheba", r"Saba"],
    35: [r"Originator", r"Fatir"],
    36: [r"Ya-Sin"],
    37: [r"Lined up", r"As-Saffat"],
    38: [r"Sad"],
    39: [r"Groups", r"Az-Zumar"],
    40: [r"Forgiver", r"Ghafir"],
    41: [r"Explained", r"Fussilat"],
    42: [r"Consultation", r"Ash-Shura"],
    43: [r"Ornaments", r"Az-Zukhruf"],
    44: [r"The Haze", r"Ad-Dukhan"],
    45: [r"Kneeling", r"Al-Jathiyah"],
    46: [r"Sand.?Hills", r"Al-Ahqaf"],
    47: [r"Muhammad"],
    48: [r"Triumph", r"Al-Fath"],
    49: [r"Private Quarters", r"Al-Hujurat"],
    50: [r"Qaf"],
    51: [r"Scattering Winds", r"Adh-Dhariyat"],
    52: [r"The Mount", r"At-Tur"],
    53: [r"The Stars", r"An-Najm"],
    54: [r"The Moon", r"Al-Qamar"],
    55: [r"Most Compassionate", r"Ar-Rahman"],
    56: [r"Inevitable", r"Al-Waqi.?ah"],
    57: [r"Iron", r"Al-Hadid"],
    58: [r"Pleading Woman", r"Al-Mujadilah"],
    59: [r"Banishment", r"Al-Hashr"],
    60: [r"Test of Faith", r"Al-Mumtahanah"],
    61: [r"Ranks", r"As-Saff"],
    62: [r"Friday", r"Al-Jumu.?ah"],
    63: [r"Hypocrites", r"Al-Munafiqun"],
    64: [r"Mutual Loss", r"At-Taghabun"],
    65: [r"Divorce", r"At-Talaq"],
    66: [r"Prohibition", r"At-Tahrim"],
    67: [r"Sovereignty", r"Al-Mulk"],
    68: [r"The Pen", r"Al-Qalam"],
    69: [r"Inevitable Hour", r"Al-Haqqah"],
    70: [r"Pathways", r"Al-Ma.?arij"],
    71: [r"Noah", r"Nuh"],
    72: [r"The Jinn"],
    73: [r"Wrapped One", r"Al-Muzzammil"],
    74: [r"Covered up", r"Al-Muddaththir", r"Cloaked"],
    75: [r"Resurrection", r"Al-Qiyamah"],
    76: [r"Humanity", r"Al-Insan"],
    77: [r"Sent Forth", r"Al-Mursalat"],
    78: [r"Momentous News", r"An-Naba"],
    79: [r"Pull Out", r"An-Nazi.?at"],
    80: [r"He Frowned", r"Abasa"],
    81: [r"Putting Out", r"At-Takwir"],
    82: [r"Splitting Open", r"Al-Infitar"],
    83: [r"Those Who Defraud", r"Al-Mutaffifin"],
    84: [r"The Splitting", r"Al-Inshiqaq"],
    85: [r"Constellations", r"Al-Buruj"],
    86: [r"Nightly Star", r"At-Tariq"],
    87: [r"Most High", r"Al-A.?la"],
    88: [r"Overwhelming", r"Al-Ghashiyah"],
    89: [r"The Dawn", r"Al-Fajr"],
    90: [r"The City", r"Al-Balad"],
    91: [r"The Sun", r"Ash-Shams"],
    92: [r"The Night", r"Al-Layl"],
    93: [r"Morning Sunlight", r"Ad-Duha"],
    94: [r"Uplifting", r"Ash-Sharh"],
    95: [r"The Fig", r"At-Tin"],
    96: [r"Clinging Clot", r"Al-.?Alaq"],
    97: [r"Night of Glory", r"Al-Qadr"],
    98: [r"Clear Proof", r"Al-Bayyinah"],
    99: [r"Earthquake", r"Az-Zalzalah"],
    100: [r"Galloping", r"Al-.?Adiyat"],
    101: [r"Striking Disaster", r"Al-Qari.?ah"],
    102: [r"Competition", r"At-Takathur"],
    103: [r"Passage of Time", r"Al-.?Asr"],
    104: [r"Backbiters", r"Al-Humazah"],
    105: [r"Elephant", r"Al-Fil"],
    106: [r"Quraysh", r"Quraish"],
    107: [r"Aid", r"Al-Ma.?un"],
    108: [r"Abundance", r"Al-Kawthar"],
    109: [r"Disbelievers", r"Al-Kafirun"],
    110: [r"Help", r"An-Nasr"],
    111: [r"Palm Fibre", r"Al-Masad"],
    112: [r"Purity of Faith", r"Al-Ikhlas"],
    113: [r"Daybreak", r"Al-Falaq"],
    114: [r"Humankind", r"An-Nas"],
}


def find_surah_start(content, surah_num, min_pos=30000):
    """Find where a surah's content starts."""
    # Check known positions first
    if surah_num in KNOWN_POSITIONS:
        return KNOWN_POSITIONS[surah_num]

    patterns = SURAH_PATTERNS.get(surah_num, [])
    for pattern in patterns:
        for m in re.finditer(pattern, content[min_pos:], re.IGNORECASE):
            pos = min_pos + m.start()
            context = content[pos:pos + 500]
            # Verify this is a surah header (has Meccan/Medinan indicator)
            if re.search(r'(Meccan|Medinan|Medin?ian|s.rah)', context, re.IGNORECASE):
                return pos
    return None


def find_surah_end(content, surah_num, start_pos):
    """Find where a surah's content ends."""
    # Check known end positions first
    if surah_num in KNOWN_END_POSITIONS:
        return KNOWN_END_POSITIONS[surah_num]

    next_surah = surah_num + 1
    if next_surah > 114:
        return len(content)

    next_start = find_surah_start(content, next_surah, start_pos + 500)
    if next_start:
        return next_start
    return len(content)


def extract_verses(text, expected_count):
    """Extract verses from inline numbered format."""
    verses = {}

    # Find the actual content start (after "In the Name of Allah")
    name_match = re.search(r'In the Name of Allah', text, re.IGNORECASE)
    if name_match:
        text = text[name_match.start():]

    # Clean up
    text = re.sub(r'\[\d+\]', '', text)  # Footnotes
    text = re.sub(r'\|\d+\|', '', text)
    text = re.sub(r'!\d+!', '', text)  # More footnote markers
    text = re.sub(r'\s+', ' ', text)

    # Split by verse numbers (period OR comma followed by space)
    pattern = r'(\d+)[.,]\s+'
    parts = re.split(pattern, text)

    i = 1
    while i < len(parts) - 1:
        try:
            verse_num = int(parts[i])
            verse_text = parts[i + 1].strip()

            if verse_num <= expected_count and verse_num > 0 and len(verse_text) > 3:
                if verse_num not in verses:
                    verses[verse_num] = verse_text
        except (ValueError, IndexError):
            pass
        i += 2

    return verses


# Manual corrections for Fatiha and other problematic verses
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

# Parse surahs
all_translations = {}

print("Parsing surahs...")

for surah_num in range(1, 115):
    expected = VERSE_COUNTS[surah_num]

    # Use manual corrections if available
    if surah_num in MANUAL_VERSES:
        all_translations[surah_num] = {str(k): v for k, v in MANUAL_VERSES[surah_num].items()}
        print(f"Surah {surah_num}: {len(MANUAL_VERSES[surah_num])}/{expected} verses [MANUAL]")
        continue

    # Find and extract from alt source
    start = find_surah_start(alt_content, surah_num)
    if start:
        end = find_surah_end(alt_content, surah_num, start)
        surah_text = alt_content[start:end]
        verses = extract_verses(surah_text, expected)

        if verses:
            all_translations[surah_num] = {str(k): v for k, v in verses.items()}
            found = len(verses)
            status = "OK" if found >= expected * 0.9 else "PARTIAL"
            print(f"Surah {surah_num}: {found}/{expected} verses [{status}]")
        else:
            print(f"Surah {surah_num}: NO VERSES EXTRACTED")
    else:
        # Try existing data
        if str(surah_num) in existing_data:
            all_translations[surah_num] = existing_data[str(surah_num)]
            found = len(existing_data[str(surah_num)])
            print(f"Surah {surah_num}: {found}/{expected} verses [EXISTING]")
        else:
            print(f"Surah {surah_num}: NOT FOUND")

# Merge with existing data for missing verses
print("\nMerging with existing data for missing verses...")
for surah_num in range(1, 115):
    surah_key = str(surah_num)
    expected = VERSE_COUNTS[surah_num]

    if surah_num in all_translations:
        current = all_translations[surah_num]
    else:
        current = {}

    # Check existing data for any missing verses
    if surah_key in existing_data:
        for verse_key, verse_text in existing_data[surah_key].items():
            if verse_key not in current:
                current[verse_key] = verse_text

    if current:
        all_translations[surah_num] = current

# Convert keys to string format for JSON
final_data = {str(k): v for k, v in all_translations.items()}

# Save result
output_path = os.path.join(os.path.dirname(__file__), "..", "src", "data", "quran", "quran_clearquran.json")
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(final_data, f, ensure_ascii=False, indent=2)

print(f"\nSaved to {output_path}")

# Statistics
total_verses = sum(len(v) for v in final_data.values())
expected_total = sum(VERSE_COUNTS.values())
print(f"\nTotal surahs: {len(final_data)}")
print(f"Total verses: {total_verses}/{expected_total}")
print(f"Coverage: {100 * total_verses / expected_total:.1f}%")

# Show missing verses
print("\nSurahs with missing verses:")
for surah_num in range(1, 115):
    expected = VERSE_COUNTS[surah_num]
    actual = len(final_data.get(str(surah_num), {}))
    if actual < expected:
        print(f"  Surah {surah_num}: {actual}/{expected} (missing {expected - actual})")
