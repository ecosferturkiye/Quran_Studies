#!/usr/bin/env python3
"""
Parse Study Quran Commentary from OCR text file.

The Study Quran by Seyyed Hossein Nasr contains:
- Surah introductions
- Verse translations
- Detailed verse-by-verse commentary

This script extracts the commentary and structures it as JSON.
"""

import re
import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# Surah names in order (English, OCR pattern for Arabic name, verse count)
# OCR patterns account for: c = hamza/ayn, 3 = ayn, spaces, dashes
SURAHS = [
    (1, "The Opening", r"al[\-\s]?Fatihah", 7),
    (2, "The Cow", r"al[\-\s]?Baqarah", 286),
    (3, "Imran", r"Al\s*[c']?\s*Imran", 200),
    (4, "Women", r"al[\-\s]?Nisa[3']?\s*$", 176),
    (5, "The Table Spread", r"al[\-\s]?Ma[3']?idah", 120),
    (6, "The Cattle", r"al[\-\s]?An\s*[c']?\s*am", 165),
    (7, "The Heights", r"al[\-\s]?A[c']?\s*raf", 206),
    (8, "The Spoils", r"al[\-\s]?Anfal", 75),
    (9, "Repentance", r"al[\-\s]?Tawbah", 129),
    (10, "Jonah", r"Yunus", 109),
    (11, "Hud", r"^Hud$", 123),
    (12, "Joseph", r"Yusuf", 111),
    (13, "The Thunder", r"al[\-\s]?Ra\s*[c']?\s*d", 43),
    (14, "Abraham", r"Ibrahim", 52),
    (15, "Hijr", r"al[\-\s]?Hijr", 99),
    (16, "The Bee", r"al[\-\s]?Nahl", 128),
    (17, "The Night Journey", r"al[\-\s]?Isra\s*[3'D]?", 111),
    (18, "The Cave", r"al[\-\s]?Kahf", 110),
    (19, "Mary", r"Maryam", 98),
    (20, "Ta Ha", r"Ta\s*Ha", 135),
    (21, "The Prophets", r"al[\-\s]?Anbiya[3']?", 112),
    (22, "The Pilgrimage", r"al[\-\s]?Hajj", 78),
    (23, "The Believers", r"al[\-\s]?Mu[3'J]?min[u]?n", 118),
    (24, "Light", r"al[\-\s]?Nur", 64),
    (25, "The Criterion", r"al[\-\s]?Furqan", 77),
    (26, "The Poets", r"al[\-\s]?Shu[c']?ara[3':j]*", 227),
    (27, "The Ants", r"al[\-\s]?Naml", 93),
    (28, "The Story", r"al[\-\s]?Qasas", 88),
    (29, "The Spider", r"al[\-\s]?[c']?Ankabut", 69),
    (30, "The Byzantines", r"al[\-\s]?Rum", 60),
    (31, "Luqman", r"^Luqman$", 34),
    (32, "Prostration", r"al[\-\s]?Sajdah", 30),
    (33, "The Parties", r"al[\-\s]?Ahzab", 73),
    (34, "Sheba", r"Saba\s*[3'J]?", 54),
    (35, "The Originator", r"Fatir", 45),
    (36, "Sin", r"Ya\s*S[im]n?", 83),
    (37, "Those Ranged in Ranks", r"al[\-\s]?Saffat", 182),
    (38, "Sad", r"^Sad$", 88),
    (39, "The Throngs", r"al[\-\s]?Zumar", 75),
    (40, "The Forgiver", r"Ghafir", 85),
    (41, "Expounded", r"Fussilat", 54),
    (42, "Counsel", r"al[\-\s]?Shura", 53),
    (43, "Gold Ornaments", r"al[\-\s]?Zukhruf", 89),
    (44, "Smoke", r"al[\-\s]?Dukhan", 59),
    (45, "Upon Their Knees", r"al[\-\s]?Jathiyah", 37),
    (46, "The Sand Dunes", r"al[\-\s]?Ahqaf", 35),
    (47, "Muhammad", r"^Muhammad$", 38),
    (48, "Victory", r"al[\-\s]?Fath", 29),
    (49, "The Private Apartments", r"al[\-\s]?Hujurat", 18),
    (50, "Qaf", r"^Qaf$", 45),
    (51, "The Scatterers", r"al[\-\s]?Dhariyat", 60),
    (52, "The Mount", r"al[\-\s]?Tur", 49),
    (53, "The Star", r"al[\-\s]?Najm", 62),
    (54, "The Moon", r"al[\-\s]?Qamar", 55),
    (55, "The Compassionate", r"al[\-\s]?Rahman", 78),
    (56, "The Event", r"al[\-\s]?Waqi[c']?ah", 96),
    (57, "Iron", r"al[\-\s]?Had[iIT]d", 29),
    (58, "She Who Disputes", r"al[\-\s]?Mujadilah", 22),
    (59, "The Gathering", r"al[\-\s]?Hashr", 24),
    (60, "She Who Is Examined", r"al[\-\s]?Mumta[hb]anah", 13),
    (61, "The Ranks", r"al[\-\s]?Saff", 14),
    (62, "The Congregational Prayer", r"al[\-\s]?Jumu[c']?ah", 11),
    (63, "The Hypocrites", r"al[\-\s]?Munafiqun", 11),
    (64, "Mutual Dispossession", r"al[\-\s]?Taghabun", 18),
    (65, "Divorce", r"al[\-\s]?Talaq", 12),
    (66, "Forbiddance", r"al[\-\s]?Tahrim", 12),
    (67, "Sovereignty", r"al[\-\s]?Mulk", 30),
    (68, "The Pen", r"al[\-\s]?Qalam", 52),
    (69, "The Undeniable Reality", r"al[\-\s]?Haqqah", 52),
    (70, "The Ascending Ways", r"al[\-\s]?Ma[c']?\s*arij", 44),
    (71, "Noah", r"^Nuh$", 28),
    (72, "The Jinn", r"al[\-\s]?Jinn", 28),
    (73, "The Enwrapped One", r"al[\-\s]?Muzzammil", 20),
    (74, "The Covered One", r"al[\-\s]?Muddaththir", 56),
    (75, "The Resurrection", r"al[\-\s]?Qiyamah", 40),
    (76, "Man", r"al[\-\s]?Insan", 31),
    (77, "Those Sent Forth", r"al[\-\s]?Mursalat", 50),
    (78, "The Tiding", r"al[\-\s]?Naba[3'0]?", 40),
    (79, "The Wresters", r"al[\-\s]?Nazi[c']?at", 46),
    (80, "He Frowned", r"[c']?Abasa", 42),
    (81, "The Enfolding", r"al[\-\s]?Takwir", 29),
    (82, "The Cleaving Asunder", r"al[\-\s]?Infitar", 19),
    (83, "Those Who Defraud", r"al[\-\s]?Mutaffifin", 36),
    (84, "The Sundering", r"al[\-\s]?Inshiqaq", 25),
    (85, "The Constellations", r"al[\-\s]?Buruj", 22),
    (86, "What Comes by Night", r"al[\-\s]?[Tt]ariq", 17),
    (87, "The Most High", r"al[\-\s]?A[c']?la", 19),
    (88, "The Overwhelming Event", r"al[\-\s]?Ghashiyah", 26),
    (89, "The Dawn", r"al[\-\s]?Fajr", 30),
    (90, "The Land", r"al[\-\s]?Balad", 20),
    (91, "The Sun", r"al[\-\s]?Shams", 15),
    (92, "The Night", r"al[\-\s]?Layl", 21),
    (93, "The Morning Brightness", r"al[\-\s]?Duha", 11),
    (94, "Expansion", r"al[\-\s]?Sharh", 8),
    (95, "The Fig", r"al[\-\s]?T[iI]n", 8),
    (96, "The Blood Clot", r"al[\-\s]?[c']?Alaq", 19),
    (97, "Power", r"al[\-\s]?Qadr", 5),
    (98, "The Clear Proof", r"al[\-\s]?Bayyinah", 8),
    (99, "The Earthquake", r"al[\-\s]?Zalzalah", 8),
    (100, "The Chargers", r"al[\-\s]?[c']?Adiyat", 11),
    (101, "The Calamity", r"al[\-\s]?Qari[c']?ah", 11),
    (102, "Vying for Increase", r"al[\-\s]?Takathur", 8),
    (103, "Declining Day", r"al[\-\s]?[c'''\u2018\u2019]?\s*Asr", 3),
    (104, "The Slanderer", r"al[\-\s]?Humazah", 9),
    (105, "The Elephant", r"al[\-\s]?F[iIT]l", 5),
    (106, "Quraysh", r"^Quraysh$", 4),
    (107, "Small Kindnesses", r"al[\-\s]?Ma[c']?un", 7),
    (108, "Abundant Good", r"al[\-\s]?Kawthar", 3),
    (109, "The Disbelievers", r"al[\-\s]?Kafirun", 6),
    (110, "Help", r"al[\-\s]?Nasr", 3),
    (111, "The Palm Fiber", r"al[\-\s]?Masad", 5),
    (112, "Sincerity", r"al[\-\s]?Ikhlas", 4),
    (113, "The Daybreak", r"al[\-\s]?Falaq", 5),
    (114, "Mankind", r"al[\-\s]?Nas", 6),
]


def clean_text(text: str) -> str:
    """Clean OCR artifacts and normalize text."""
    # Replace multiple spaces with single space
    text = re.sub(r'  +', ' ', text)
    # Fix common OCR errors
    text = text.replace('c ', "'")  # c with space often means '
    text = text.replace(' c', "'")
    # Normalize quotes
    text = text.replace('"', '"').replace('"', '"')
    text = text.replace(''', "'").replace(''', "'")
    return text.strip()


def find_surah_boundaries(lines: List[str]) -> Dict[int, Tuple[int, int]]:
    """
    Find the start and end line numbers for each surah's content.
    Returns dict: surah_number -> (start_line, end_line)
    """
    boundaries = {}
    surah_starts = []
    found_surahs = set()

    # First pass: find all potential surah starts
    for i, line in enumerate(lines):
        line_clean = line.strip()
        if not line_clean or len(line_clean) < 3:
            continue

        # Skip table of contents section (first ~2250 lines, but surahs start around 2270)
        if i < 2250:
            continue

        for surah_num, eng_name, ar_pattern, _ in SURAHS:
            if surah_num in found_surahs:
                continue

            # Check for Arabic name pattern
            try:
                if re.search(rf'^{ar_pattern}\s*$', line_clean, re.IGNORECASE):
                    # Look at surrounding lines to verify this is a surah header
                    prev_lines = [lines[j].strip() for j in range(max(0, i-3), i)]
                    next_lines = [lines[j].strip() for j in range(i+1, min(len(lines), i+5))]

                    # Check if previous line contains English name
                    # Normalize spaces for comparison (OCR has double spaces)
                    is_header = False
                    eng_name_normalized = ' '.join(eng_name.lower().split())
                    for pl in prev_lines:
                        pl_normalized = ' '.join(pl.lower().split())
                        if eng_name_normalized in pl_normalized:
                            is_header = True
                            break

                    # Also check if this looks like a surah header context
                    # (not just mentioned in commentary text)
                    if is_header or (len(line_clean) < 30 and any("surah" in nl.lower() or "revealed" in nl.lower() for nl in next_lines[:3])):
                        # Find the actual start (English name line)
                        start_line = i
                        for j in range(i-1, max(0, i-5), -1):
                            line_normalized = ' '.join(lines[j].lower().split())
                            if eng_name_normalized in line_normalized:
                                start_line = j
                                break

                        surah_starts.append((start_line, surah_num))
                        found_surahs.add(surah_num)
                        break
            except re.error:
                continue

    # Sort by line number
    surah_starts.sort(key=lambda x: x[0])

    # Find end boundaries
    for idx, (start_line, surah_num) in enumerate(surah_starts):
        if idx + 1 < len(surah_starts):
            end_line = surah_starts[idx + 1][0] - 1
        else:
            end_line = len(lines) - 1
        boundaries[surah_num] = (start_line, end_line)

    return boundaries


def extract_commentary_for_verse(text: str, verse_num: int, max_verse: int) -> Optional[str]:
    """
    Extract commentary for a specific verse number from text block.
    """
    # Pattern: verse number at start of line/paragraph
    pattern = rf'^{verse_num}\s+'

    lines = text.split('\n')
    commentary_lines = []
    capturing = False

    for line in lines:
        line = line.strip()
        if not line:
            if capturing:
                commentary_lines.append('')
            continue

        # Check if this line starts a new verse commentary
        if re.match(rf'^{verse_num}\s+', line):
            capturing = True
            # Remove verse number prefix
            line = re.sub(rf'^{verse_num}\s+', '', line)
            commentary_lines.append(line)
        elif capturing:
            # Check if we hit the next verse number
            next_verse_match = re.match(r'^(\d+)\s+', line)
            if next_verse_match:
                next_num = int(next_verse_match.group(1))
                if next_num > verse_num and next_num <= max_verse:
                    break  # Next verse started
            commentary_lines.append(line)

    if commentary_lines:
        return clean_text(' '.join(commentary_lines))
    return None


def parse_surah_commentary(text: str, surah_num: int, verse_count: int) -> Dict[str, str]:
    """
    Parse all verse commentaries for a surah.
    Returns dict: verse_key -> commentary
    """
    commentaries = {}

    # Split into lines for processing
    lines = text.split('\n')
    full_text = ' '.join(lines)

    # Find all verse commentary blocks
    # Pattern: number at start followed by text, up to next number
    current_verse = None
    current_commentary = []

    for line in lines:
        line = line.strip()
        if not line:
            if current_verse:
                current_commentary.append('')
            continue

        # Check for verse number at start of line
        match = re.match(r'^(\d{1,3})\s+(.+)', line)
        if match:
            num = int(match.group(1))
            # Valid verse number for this surah
            if 1 <= num <= verse_count:
                # Save previous verse if exists
                if current_verse is not None:
                    verse_key = f"{surah_num}:{current_verse}"
                    comm_text = ' '.join(current_commentary)
                    comm_text = clean_text(comm_text)
                    if comm_text:
                        commentaries[verse_key] = comm_text

                # Start new verse
                current_verse = num
                current_commentary = [match.group(2)]
            elif current_verse is not None:
                # Not a valid verse number, continue current
                current_commentary.append(line)
        elif current_verse is not None:
            current_commentary.append(line)

    # Don't forget last verse
    if current_verse is not None:
        verse_key = f"{surah_num}:{current_verse}"
        comm_text = ' '.join(current_commentary)
        comm_text = clean_text(comm_text)
        if comm_text:
            commentaries[verse_key] = comm_text

    return commentaries


def parse_studyquran(input_file: str, output_file: str) -> Dict:
    """
    Main parsing function.
    """
    print(f"Reading {input_file}...")

    with open(input_file, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()

    lines = content.split('\n')
    print(f"Total lines: {len(lines)}")

    # Find surah boundaries
    print("Finding surah boundaries...")
    boundaries = find_surah_boundaries(lines)
    print(f"Found {len(boundaries)} surahs")

    # Parse each surah
    all_commentaries = {}
    stats = {
        'total_verses': 0,
        'found_verses': 0,
        'missing_verses': [],
        'surahs_processed': 0
    }

    for surah_num, eng_name, ar_name, verse_count in SURAHS:
        stats['total_verses'] += verse_count

        if surah_num not in boundaries:
            print(f"  Warning: Surah {surah_num} ({eng_name}) not found")
            for v in range(1, verse_count + 1):
                stats['missing_verses'].append(f"{surah_num}:{v}")
            continue

        start_line, end_line = boundaries[surah_num]
        surah_text = '\n'.join(lines[start_line:end_line+1])

        # Parse commentaries
        commentaries = parse_surah_commentary(surah_text, surah_num, verse_count)

        # Track stats
        for v in range(1, verse_count + 1):
            verse_key = f"{surah_num}:{v}"
            if verse_key in commentaries:
                all_commentaries[verse_key] = commentaries[verse_key]
                stats['found_verses'] += 1
            else:
                stats['missing_verses'].append(verse_key)

        stats['surahs_processed'] += 1

        if surah_num % 10 == 0 or surah_num <= 5:
            print(f"  Surah {surah_num}: {len(commentaries)}/{verse_count} verses")

    # Save output
    print(f"\nSaving to {output_file}...")

    output_data = {
        'metadata': {
            'source': 'The Study Quran by Seyyed Hossein Nasr',
            'type': 'commentary',
            'stats': {
                'total_expected': stats['total_verses'],
                'total_found': stats['found_verses'],
                'coverage_percent': round(100 * stats['found_verses'] / stats['total_verses'], 2),
                'surahs_processed': stats['surahs_processed']
            }
        },
        'commentary': all_commentaries
    }

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"\n=== Summary ===")
    print(f"Total verses expected: {stats['total_verses']}")
    print(f"Verses with commentary: {stats['found_verses']}")
    print(f"Coverage: {output_data['metadata']['stats']['coverage_percent']}%")
    print(f"Missing verses: {len(stats['missing_verses'])}")

    if stats['missing_verses'][:20]:
        print(f"First 20 missing: {stats['missing_verses'][:20]}")

    return output_data


if __name__ == '__main__':
    script_dir = Path(__file__).parent
    input_file = script_dir / 'studyquran_raw.txt'
    output_file = script_dir.parent / 'src' / 'data' / 'quran' / 'studyquran_commentary.json'

    # Create output directory if needed
    output_file.parent.mkdir(parents=True, exist_ok=True)

    parse_studyquran(str(input_file), str(output_file))
