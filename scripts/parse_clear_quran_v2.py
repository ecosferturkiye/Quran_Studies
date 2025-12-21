import json
import re
import os

# Parse Clear Quran from alternative archive.org source
# This version has inline numbered verses like "1. text 2. text 3. text"

raw_path = os.path.join(os.path.dirname(__file__), "clear_quran_alt.txt")

print("Reading alternative source file...")
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
    1: ["The Opening", "Al-Fatihah", "Al-F.?ti.?hah"],
    2: ["The Cow", "Al-Baqarah", "Al-Bagarah"],
    3: ["The Family of Imran", "Ali-Imran", "Ali-.?Imran"],
    4: ["Women", "An-Nisa", "An-Nis"],
    5: ["The Spread Table", "Al-Ma.?idah"],
    6: ["Cattle", "Al-An.?am"],
    7: ["The Heights", "Al-A.?raf"],
    8: ["Spoils of War", "Al-Anfal"],
    9: ["Repentance", "At-Tawbah"],
    10: ["Jonah", "Yunus"],
    11: ["Hud", "H.?d"],
    12: ["Joseph", "Yusuf"],
    13: ["Thunder", "Ar-Ra.?d"],
    14: ["Abraham", "Ibrahim"],
    15: ["The Stone Valley", "Al-Hijr"],
    16: ["Bees", "An-Nahl"],
    17: ["The Night Journey", "Al-Isra"],
    18: ["The Cave", "Al-Kahf"],
    19: ["Mary", "Maryam", "Mariam"],
    20: ["Ta-Ha", "Taha"],
    21: ["The Prophets", "Al-Anbiya"],
    22: ["The Pilgrimage", "Al-Hajj"],
    23: ["The Believers", "Al-Mu.?min"],
    24: ["The Light", "An-Nur"],
    25: ["The Standard", "Al-Furqan"],
    26: ["The Poets", "Ash-Shu.?ara"],
    27: ["The Ants", "An-Naml"],
    28: ["The Whole Story", "Al-Qasas"],
    29: ["The Spider", "Al-Ankabut"],
    30: ["The Romans", "Ar-Rum"],
    31: ["Luqman", "Lugman"],
    32: ["The Prostration", "As-Sajdah"],
    33: ["The Enemy Alliance", "Al-Ahzab"],
    34: ["Sheba", "Saba"],
    35: ["The Originator", "Fatir"],
    36: ["Ya-Sin", "Yasin"],
    37: ["Those.*Lined up", "As-Saffat"],
    38: ["Sad"],
    39: ["The.*Groups", "Az-Zumar"],
    40: ["The Forgiver", "Ghafir"],
    41: ["Verses.*Explained", "Fussilat"],
    42: ["Consultation", "Ash-Shura"],
    43: ["Ornaments", "Az-Zukhruf"],
    44: ["The Haze", "Ad-Dukhan"],
    45: ["Kneeling", "Al-Jathiyah"],
    46: ["The Sand.?Hills", "Al-Ahqaf"],
    47: ["Muhammad"],
    48: ["The Triumph", "Al-Fath"],
    49: ["The Private Quarters", "Al-Hujurat"],
    50: ["Qaf"],
    51: ["The Winds", "Adh-Dhariyat"],
    52: ["The Mount", "At-Tur"],
    53: ["The Stars", "An-Najm"],
    54: ["The Moon", "Al-Qamar"],
    55: ["The Most Compassionate", "Ar-Rahman"],
    56: ["The Inevitable", "Al-Waqi.?ah"],
    57: ["Iron", "Al-Hadid"],
    58: ["The Pleading Woman", "Al-Mujadilah"],
    59: ["The Banishment", "Al-Hashr"],
    60: ["The Test of Faith", "Al-Mumtahanah"],
    61: ["The.*Ranks", "As-Saff"],
    62: ["Friday", "Al-Jumu.?ah"],
    63: ["The Hypocrites", "Al-Munafiqun"],
    64: ["Mutual Loss", "At-Taghabun"],
    65: ["Divorce", "At-Talaq"],
    66: ["The Prohibition", "At-Tahrim"],
    67: ["Sovereignty", "Al-Mulk"],
    68: ["The Pen", "Al-Qalam"],
    69: ["The Inevitable Hour", "Al-Haqqah"],
    70: ["Pathways of.*Ascent", "Al-Ma.?arij"],
    71: ["Noah", "Nuh"],
    72: ["The Jinn", "Al-Jinn"],
    73: ["The Wrapped One", "Al-Muzzammil"],
    74: ["The Cloaked One", "Al-Muddaththir"],
    75: ["The Resurrection", "Al-Qiyamah"],
    76: ["Humanity", "Al-Insan"],
    77: ["Those Sent Forth", "Al-Mursalat"],
    78: ["The Momentous News", "An-Naba"],
    79: ["Those.*Pull Out", "An-Nazi.?at"],
    80: ["He Frowned", "Abasa"],
    81: ["Putting Out.*Sun", "At-Takwir"],
    82: ["The Shattering", "Al-Infitar"],
    83: ["Those Who Defraud", "Al-Mutaffifin"],
    84: ["The Splitting", "Al-Inshiqaq"],
    85: ["Constellations", "Al-Buruj"],
    86: ["The Nightly Visitor", "At-Tariq"],
    87: ["The Most High", "Al-A.?la"],
    88: ["The Overwhelming", "Al-Ghashiyah"],
    89: ["The Dawn", "Al-Fajr"],
    90: ["The City", "Al-Balad"],
    91: ["The Sun", "Ash-Shams"],
    92: ["The Night", "Al-Layl"],
    93: ["The Morning Sunlight", "Ad-Duha"],
    94: ["Uplifting the Heart", "Ash-Sharh"],
    95: ["The Fig", "At-Tin"],
    96: ["The Clinging Clot", "Al-.?Alaq"],
    97: ["The Night of Glory", "Al-Qadr"],
    98: ["The Clear Proof", "Al-Bayyinah"],
    99: ["The Earthquake", "Az-Zalzalah"],
    100: ["The Galloping.*Horses", "Al-.?Adiyat"],
    101: ["The Striking Disaster", "Al-Qari.?ah"],
    102: ["Competition", "At-Takathur"],
    103: ["The Passage of Time", "Al-.?Asr"],
    104: ["The Backbiters", "Al-Humazah"],
    105: ["The Elephant", "Al-Fil"],
    106: ["Quraysh", "Quraish"],
    107: ["Aid", "Al-Ma.?un"],
    108: ["Abundance", "Al-Kawthar"],
    109: ["The Disbelievers", "Al-Kafirun"],
    110: ["The.*Help", "An-Nasr"],
    111: ["The Palm Fibre", "Al-Masad"],
    112: ["Purity of Faith", "Al-Ikhlas"],
    113: ["The Daybreak", "Al-Falaq"],
    114: ["Humankind", "An-Nas"],
}

def find_surah_boundaries(content, surah_num):
    """Find the start and end positions of a surah's content."""
    names = SURAH_NAMES.get(surah_num, [])

    # Build pattern to match surah header
    # Looking for patterns like "1. The Opening" or "The Opening\n(Al-Fatihah)"
    start_pos = None

    for name in names:
        # Try to find the surah heading (not in TOC - after position 30000)
        pattern = rf'(?:{surah_num}\.\s*)?{name}'
        for match in re.finditer(pattern, content[30000:], re.IGNORECASE):
            pos = 30000 + match.start()
            # Check if this looks like a surah heading (has intro text nearby)
            context = content[pos:pos+500]
            if re.search(r'(Meccan|Medinan|Medin?ian|surah|s.rah)', context, re.IGNORECASE):
                start_pos = pos
                break
        if start_pos:
            break

    if start_pos is None:
        return None, None

    # Find end (next surah or end of content)
    end_pos = len(content)
    next_surah = surah_num + 1
    if next_surah <= 114:
        next_names = SURAH_NAMES.get(next_surah, [])
        for name in next_names:
            pattern = rf'(?:{next_surah}\.\s*)?{name}'
            for match in re.finditer(pattern, content[start_pos + 500:], re.IGNORECASE):
                pos = start_pos + 500 + match.start()
                context = content[pos:pos+500]
                if re.search(r'(Meccan|Medinan|Medin?ian|surah|s.rah)', context, re.IGNORECASE):
                    end_pos = pos
                    break
            if end_pos < len(content):
                break

    return start_pos, end_pos

def extract_inline_verses(text, expected_count):
    """Extract verses from inline numbered format like '1. text 2. text 3. text'"""
    verses = {}

    # Clean up text
    text = re.sub(r'\[\d+\]', '', text)  # Remove footnote markers
    text = re.sub(r'\|\d+\|', '', text)
    text = re.sub(r'\s+', ' ', text)

    # Pattern: number followed by period and space
    # Match "1. text" up to "2. " or end
    pattern = r'(\d+)\.\s+'
    parts = re.split(pattern, text)

    i = 1
    while i < len(parts) - 1:
        try:
            verse_num = int(parts[i])
            verse_text = parts[i + 1].strip()

            # Clean up verse text
            verse_text = verse_text.strip()

            # Only accept if reasonable and within range
            if verse_num <= expected_count and verse_num > 0 and len(verse_text) > 3:
                if verse_num not in verses:
                    verses[verse_num] = verse_text
        except (ValueError, IndexError):
            pass
        i += 2

    return verses

# Parse each surah
all_translations = {}
missing_surahs = []

print("Parsing surahs from alternative source...")

for surah_num in range(1, 115):
    expected = VERSE_COUNTS[surah_num]
    start, end = find_surah_boundaries(content, surah_num)

    if start is not None:
        surah_content = content[start:end]
        verses = extract_inline_verses(surah_content, expected)

        if verses:
            all_translations[surah_num] = {str(k): v for k, v in verses.items()}
            found = len(verses)
            status = "OK" if found >= expected * 0.9 else "PARTIAL"
            print(f"Surah {surah_num}: {found}/{expected} verses [{status}]")
        else:
            print(f"Surah {surah_num}: NO VERSES EXTRACTED")
            missing_surahs.append(surah_num)
    else:
        print(f"Surah {surah_num}: CONTENT NOT FOUND")
        missing_surahs.append(surah_num)

# Save result
output_path = os.path.join(os.path.dirname(__file__), "..", "src", "data", "quran", "quran_clearquran.json")

with open(output_path, "w", encoding="utf-8") as f:
    json.dump(all_translations, f, ensure_ascii=False, indent=2)

print(f"\nSaved to {output_path}")

# Statistics
total_verses = sum(len(v) for v in all_translations.values())
expected_total = sum(VERSE_COUNTS.values())
print(f"\nTotal surahs: {len(all_translations)}")
print(f"Total verses: {total_verses}/{expected_total}")
print(f"Coverage: {100*total_verses/expected_total:.1f}%")

if missing_surahs:
    print(f"\nMissing surahs: {missing_surahs}")
