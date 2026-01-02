#!/usr/bin/env python3
"""
Kur'an Yolu Tefsiri Fetcher v2
Faster version using concurrent requests and proper encoding.

Output: kuranyolu_commentary.json
"""

import json
import re
import os
import time
import urllib.request
from pathlib import Path
from html import unescape
from concurrent.futures import ThreadPoolExecutor, as_completed

# Configuration
SCRIPT_DIR = Path(__file__).parent
OUTPUT_DIR = SCRIPT_DIR.parent / "src" / "data" / "quran"
OUTPUT_FILE = OUTPUT_DIR / "kuranyolu_commentary.json"
CACHE_DIR = SCRIPT_DIR / "cache_kuranyolu_v2"

# Base URL - tefsir mode
BASE_URL = "https://kuran.diyanet.gov.tr/mushaf/kuran-tefsir-1/{surah_slug}-suresi-{surah_id}/ayet-1/diyanet-isleri-baskanligi-meali-1"

# Surah info: (id, slug, name_tr, verse_count)
SURAHS = [
    (1, "fatiha", "Fâtiha", 7),
    (2, "bakara", "Bakara", 286),
    (3, "al-i-imran", "Âl-i İmrân", 200),
    (4, "nisa", "Nisâ", 176),
    (5, "maide", "Mâide", 120),
    (6, "enam", "En'âm", 165),
    (7, "araf", "A'râf", 206),
    (8, "enfal", "Enfâl", 75),
    (9, "tevbe", "Tevbe", 129),
    (10, "yunus", "Yûnus", 109),
    (11, "hud", "Hûd", 123),
    (12, "yusuf", "Yûsuf", 111),
    (13, "rad", "Ra'd", 43),
    (14, "ibrahim", "İbrâhîm", 52),
    (15, "hicr", "Hicr", 99),
    (16, "nahl", "Nahl", 128),
    (17, "isra", "İsrâ", 111),
    (18, "kehf", "Kehf", 110),
    (19, "meryem", "Meryem", 98),
    (20, "taha", "Tâ-Hâ", 135),
    (21, "enbiya", "Enbiyâ", 112),
    (22, "hac", "Hac", 78),
    (23, "muminun", "Mü'minûn", 118),
    (24, "nur", "Nûr", 64),
    (25, "furkan", "Furkân", 77),
    (26, "suara", "Şuarâ", 227),
    (27, "neml", "Neml", 93),
    (28, "kasas", "Kasas", 88),
    (29, "ankebut", "Ankebût", 69),
    (30, "rum", "Rûm", 60),
    (31, "lokman", "Lokmân", 34),
    (32, "secde", "Secde", 30),
    (33, "ahzab", "Ahzâb", 73),
    (34, "sebe", "Sebe'", 54),
    (35, "fatir", "Fâtır", 45),
    (36, "yasin", "Yâsîn", 83),
    (37, "saffat", "Sâffât", 182),
    (38, "sad", "Sâd", 88),
    (39, "zumer", "Zümer", 75),
    (40, "mumin", "Mü'min", 85),
    (41, "fussilet", "Fussilet", 54),
    (42, "sura", "Şûrâ", 53),
    (43, "zuhruf", "Zuhruf", 89),
    (44, "duhan", "Duhân", 59),
    (45, "casiye", "Câsiye", 37),
    (46, "ahkaf", "Ahkâf", 35),
    (47, "muhammed", "Muhammed", 38),
    (48, "fetih", "Fetih", 29),
    (49, "hucurat", "Hucurât", 18),
    (50, "kaf", "Kâf", 45),
    (51, "zariyat", "Zâriyât", 60),
    (52, "tur", "Tûr", 49),
    (53, "necm", "Necm", 62),
    (54, "kamer", "Kamer", 55),
    (55, "rahman", "Rahmân", 78),
    (56, "vakia", "Vâkıa", 96),
    (57, "hadid", "Hadîd", 29),
    (58, "mucadele", "Mücâdele", 22),
    (59, "hasr", "Haşr", 24),
    (60, "mumtehine", "Mümtehine", 13),
    (61, "saf", "Saf", 14),
    (62, "cuma", "Cum'a", 11),
    (63, "munafikun", "Münâfikûn", 11),
    (64, "tegabun", "Teğâbün", 18),
    (65, "talak", "Talâk", 12),
    (66, "tahrim", "Tahrîm", 12),
    (67, "mulk", "Mülk", 30),
    (68, "kalem", "Kalem", 52),
    (69, "hakka", "Hâkka", 52),
    (70, "mearic", "Meâric", 44),
    (71, "nuh", "Nûh", 28),
    (72, "cin", "Cin", 28),
    (73, "muzzemmil", "Müzzemmil", 20),
    (74, "muddessir", "Müddessir", 56),
    (75, "kiyamet", "Kıyâmet", 40),
    (76, "insan", "İnsan", 31),
    (77, "murselat", "Mürselât", 50),
    (78, "nebe", "Nebe'", 40),
    (79, "naziat", "Nâziât", 46),
    (80, "abese", "Abese", 42),
    (81, "tekvir", "Tekvîr", 29),
    (82, "infitar", "İnfitâr", 19),
    (83, "mutaffifin", "Mutaffifîn", 36),
    (84, "insikak", "İnşikâk", 25),
    (85, "buruc", "Bürûc", 22),
    (86, "tarik", "Târık", 17),
    (87, "ala", "A'lâ", 19),
    (88, "gasiye", "Ğâşiye", 26),
    (89, "fecr", "Fecr", 30),
    (90, "beled", "Beled", 20),
    (91, "sems", "Şems", 15),
    (92, "leyl", "Leyl", 21),
    (93, "duha", "Duhâ", 11),
    (94, "insirah", "İnşirâh", 8),
    (95, "tin", "Tîn", 8),
    (96, "alak", "Alak", 19),
    (97, "kadr", "Kadr", 5),
    (98, "beyyine", "Beyyine", 8),
    (99, "zilzal", "Zilzâl", 8),
    (100, "adiyat", "Âdiyât", 11),
    (101, "karia", "Kâria", 11),
    (102, "tekasur", "Tekâsür", 8),
    (103, "asr", "Asr", 3),
    (104, "humeze", "Hümeze", 9),
    (105, "fil", "Fîl", 5),
    (106, "kureys", "Kureyş", 4),
    (107, "maun", "Mâûn", 7),
    (108, "kevser", "Kevser", 3),
    (109, "kafirun", "Kâfirûn", 6),
    (110, "nasr", "Nasr", 3),
    (111, "tebbet", "Tebbet", 5),
    (112, "ihlas", "İhlâs", 4),
    (113, "felak", "Felak", 5),
    (114, "nas", "Nâs", 6),
]


def clean_html(text: str) -> str:
    """Remove HTML tags and clean text."""
    if not text:
        return ""
    # Unescape HTML entities
    text = unescape(text)
    # Remove HTML tags but preserve line breaks
    text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'<p[^>]*>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'</p>', '', text, flags=re.IGNORECASE)
    text = re.sub(r'<[^>]+>', '', text)
    # Clean whitespace
    text = re.sub(r'\n\s*\n', '\n\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    return text.strip()


def fetch_page(url: str, cache_file: Path) -> str:
    """Fetch page content with caching and proper encoding."""
    if cache_file.exists():
        with open(cache_file, 'r', encoding='utf-8') as f:
            return f.read()

    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'identity',  # No compression to avoid encoding issues
        })
        with urllib.request.urlopen(req, timeout=30) as response:
            # Read as bytes first
            raw_bytes = response.read()
            # Try UTF-8 first, fallback to ISO-8859-9 (Turkish)
            try:
                content = raw_bytes.decode('utf-8')
            except UnicodeDecodeError:
                content = raw_bytes.decode('iso-8859-9')

        cache_file.parent.mkdir(parents=True, exist_ok=True)
        with open(cache_file, 'w', encoding='utf-8') as f:
            f.write(content)

        return content
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return ""


def extract_tefsir_from_page(html: str, surah_id: int) -> dict:
    """Extract tefsir data from page HTML."""
    tefsir_data = {}

    # Find MPageDmList JavaScript variable
    match = re.search(r'MPageDmList\s*=\s*(\[.*?\]);', html, re.DOTALL)
    if not match:
        return tefsir_data

    try:
        json_str = match.group(1)
        # Fix common JSON issues
        json_str = re.sub(r',\s*}', '}', json_str)
        json_str = re.sub(r',\s*]', ']', json_str)

        data = json.loads(json_str)

        for page in data:
            if 'TefsirList' in page and page['TefsirList']:
                for tefsir in page['TefsirList']:
                    verse_num = tefsir.get('AyetNumber', '')
                    tefsir_text = tefsir.get('AyetText', '')

                    if verse_num and tefsir_text:
                        key = f"{surah_id}:{verse_num}"
                        tefsir_data[key] = clean_html(tefsir_text)

    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")

    return tefsir_data


def fetch_surah_tefsir(surah_info: tuple) -> dict:
    """Fetch all tefsir for a surah."""
    surah_id, surah_slug, surah_name, verse_count = surah_info
    tefsir = {}

    url = BASE_URL.format(surah_slug=surah_slug, surah_id=surah_id)
    cache_file = CACHE_DIR / f"surah_{surah_id:03d}.html"

    html = fetch_page(url, cache_file)
    if html:
        tefsir = extract_tefsir_from_page(html, surah_id)

    print(f"  {surah_id}. {surah_name}: {len(tefsir)}/{verse_count} verses")
    return tefsir


def create_output(commentary: dict) -> dict:
    """Create the final JSON structure."""
    return {
        "metadata": {
            "source": "Kur'an Yolu Tefsiri - Diyanet İşleri Başkanlığı",
            "authors": "Hayrettin Karaman, Mustafa Çağrıcı, İbrahim Kafi Dönmez, Sadrettin Gümüş",
            "type": "commentary",
            "language": "Turkish",
            "website": "https://kuran.diyanet.gov.tr",
            "stats": {
                "total_expected": 6236,
                "total_found": len(commentary),
                "coverage_percent": round(len(commentary) / 6236 * 100, 2),
                "surahs_processed": len(set(k.split(':')[0] for k in commentary.keys()))
            }
        },
        "commentary": commentary
    }


def main():
    print("=" * 60)
    print("Kur'an Yolu Tefsiri Fetcher v2")
    print("=" * 60)

    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    all_commentary = {}

    # Use thread pool for concurrent fetching
    print("\nFetching surahs concurrently...")
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(fetch_surah_tefsir, s): s for s in SURAHS}

        for future in as_completed(futures):
            tefsir = future.result()
            all_commentary.update(tefsir)

    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Create output
    output = create_output(all_commentary)

    # Write JSON
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 60)
    print(f"DONE!")
    print(f"Output: {OUTPUT_FILE}")
    print(f"Total verses: {len(all_commentary)}")
    print(f"Coverage: {output['metadata']['stats']['coverage_percent']}%")
    print("=" * 60)

    # Show sample
    if all_commentary:
        sample_key = "1:1"
        if sample_key in all_commentary:
            sample_text = all_commentary[sample_key][:300] + "..." if len(all_commentary[sample_key]) > 300 else all_commentary[sample_key]
            print(f"\nSample ({sample_key}):\n{sample_text}")


if __name__ == "__main__":
    main()
