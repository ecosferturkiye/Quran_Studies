#!/usr/bin/env python3
"""
Fetch Elmalılı tefsir from Archive.org
Source: https://archive.org/details/ElmaliliKuranTefsiri
"""

import json
import time
import urllib.request
import urllib.error
import re
import os

# Archive.org item identifier
ITEM_ID = "ElmaliliKuranTefsiri"

# Surah names for reference
SURAH_NAMES = [
    "Fatiha", "Bakara", "Al-i Imran", "Nisa", "Maide", "Enam", "Araf", "Enfal", "Tevbe", "Yunus",
    "Hud", "Yusuf", "Rad", "Ibrahim", "Hicr", "Nahl", "Isra", "Kehf", "Meryem", "Taha",
    "Enbiya", "Hac", "Muminun", "Nur", "Furkan", "Suara", "Neml", "Kasas", "Ankebut", "Rum",
    "Lokman", "Secde", "Ahzab", "Sebe", "Fatir", "Yasin", "Saffat", "Sad", "Zumer", "Mumin",
    "Fussilet", "Sura", "Zuhruf", "Duhan", "Casiye", "Ahkaf", "Muhammed", "Fetih", "Hucurat", "Kaf",
    "Zariyat", "Tur", "Necm", "Kamer", "Rahman", "Vakia", "Hadid", "Mucadele", "Hasr", "Mumtehine",
    "Saff", "Cuma", "Munafikun", "Tegabun", "Talak", "Tahrim", "Mulk", "Kalem", "Hakka", "Mearic",
    "Nuh", "Cin", "Muzzemmil", "Muddessir", "Kiyame", "Insan", "Murselat", "Nebe", "Naziat", "Abese",
    "Tekvir", "Infitar", "Mutaffifin", "Insikak", "Buruc", "Tarik", "Ala", "Gasiye", "Fecr", "Beled",
    "Sems", "Leyl", "Duha", "Insirah", "Tin", "Alak", "Kadr", "Beyyine", "Zilzal", "Adiyat",
    "Karia", "Tekasur", "Asr", "Humeze", "Fil", "Kureys", "Maun", "Kevser", "Kafirun", "Nasr",
    "Tebbet", "Ihlas", "Felak", "Nas"
]

def fetch_text_file(surah_num: int) -> str:
    """Fetch text file for a surah from Archive.org"""
    # Try different filename patterns
    patterns = [
        f"{surah_num} {SURAH_NAMES[surah_num-1]} Suresi_djvu.txt",
        f"{surah_num:02d} {SURAH_NAMES[surah_num-1]} Suresi_djvu.txt",
        f"{surah_num} {SURAH_NAMES[surah_num-1]}_djvu.txt",
    ]

    for pattern in patterns:
        url = f"https://archive.org/download/{ITEM_ID}/{urllib.request.quote(pattern)}"
        try:
            req = urllib.request.Request(url, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            })
            with urllib.request.urlopen(req, timeout=30) as response:
                return response.read().decode('utf-8', errors='replace')
        except Exception as e:
            continue

    return ""

def fetch_full_text() -> str:
    """Fetch the full text file from Archive.org"""
    # Try to get the combined text file
    url = f"https://archive.org/download/{ITEM_ID}/{ITEM_ID}_djvu.txt"
    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        with urllib.request.urlopen(req, timeout=120) as response:
            return response.read().decode('utf-8', errors='replace')
    except Exception as e:
        print(f"Error fetching full text: {e}")
        return ""

def clean_text(text: str) -> str:
    """Clean OCR text"""
    # Remove excessive whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' +', ' ', text)

    # Keep Turkish and Arabic characters
    # Remove weird OCR artifacts but keep essential punctuation
    text = re.sub(r'[^\w\s\n.,;:\'\"()[\]{}!?،؛\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFFÇçĞğİıÖöŞşÜü-]', '', text)

    return text.strip()

def split_by_surah(full_text: str) -> dict:
    """Split full text into surahs"""
    surahs = {}

    # Try to find surah markers
    surah_pattern = re.compile(r'(\d{1,3})\s*(\.|\-|:)?\s*(SURE|Sûre|SÛRE|Sure)', re.IGNORECASE)

    # Split by surah markers
    parts = surah_pattern.split(full_text)

    current_surah = None
    current_text = []

    for part in parts:
        # Check if this is a surah number
        if part.strip().isdigit():
            num = int(part.strip())
            if 1 <= num <= 114:
                # Save previous surah
                if current_surah and current_text:
                    surahs[str(current_surah)] = clean_text('\n'.join(current_text))
                current_surah = num
                current_text = []
                continue

        if current_surah:
            current_text.append(part)

    # Save last surah
    if current_surah and current_text:
        surahs[str(current_surah)] = clean_text('\n'.join(current_text))

    return surahs

def main():
    print("Fetching Elmalılı tefsir from Archive.org...")
    print(f"Source: https://archive.org/details/{ITEM_ID}")
    print()

    # First try to get full text
    print("Fetching full text file...")
    full_text = fetch_full_text()

    if full_text:
        print(f"Got full text: {len(full_text)} characters")

        # Check if it has Arabic content
        arabic_pattern = re.compile(r'[\u0600-\u06FF]+')
        arabic_matches = arabic_pattern.findall(full_text)
        print(f"Arabic words found: {len(arabic_matches)}")
        if arabic_matches:
            print(f"Sample Arabic: {arabic_matches[:5]}")

        # Split into surahs
        print("Splitting by surah...")
        surahs_data = split_by_surah(full_text)
        print(f"Found {len(surahs_data)} surahs")

        # Build output
        output = {
            "metadata": {
                "source": "Archive.org - Elmalılı Muhammed Hamdi Yazır - Hak Dini Kur'an Dili",
                "url": f"https://archive.org/details/{ITEM_ID}",
                "type": "Türkçe Tefsir (OCR)",
                "note": "OCR ile dijitalleştirilmiş metin. Arapça ifadeler korunmuştur.",
                "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%S")
            },
            "surahs": {}
        }

        for surah_id in range(1, 115):
            if str(surah_id) in surahs_data:
                output["surahs"][str(surah_id)] = {
                    "surah_id": surah_id,
                    "surah_name": SURAH_NAMES[surah_id - 1],
                    "tefsir": surahs_data[str(surah_id)]
                }

        # Save
        output_path = "src/data/quran/elmalili_tefsir_new.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)

        print(f"\nSaved to {output_path}")
        print(f"Surahs with content: {len(output['surahs'])}")

        # Show sample
        if output['surahs'].get('1'):
            sample = output['surahs']['1']['tefsir'][:500]
            print(f"\nSample from Fatiha:\n{sample}...")
    else:
        print("Could not fetch full text. Trying individual files...")

        output = {
            "metadata": {
                "source": "Archive.org - Elmalılı Muhammed Hamdi Yazır - Hak Dini Kur'an Dili",
                "url": f"https://archive.org/details/{ITEM_ID}",
                "type": "Türkçe Tefsir (OCR)",
                "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%S")
            },
            "surahs": {}
        }

        for surah_id in range(1, 115):
            print(f"Fetching surah {surah_id}/114...")
            text = fetch_text_file(surah_id)

            if text:
                output["surahs"][str(surah_id)] = {
                    "surah_id": surah_id,
                    "surah_name": SURAH_NAMES[surah_id - 1],
                    "tefsir": clean_text(text)
                }

            time.sleep(0.5)

        # Save
        output_path = "src/data/quran/elmalili_tefsir_new.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)

        print(f"\nSaved {len(output['surahs'])} surahs to {output_path}")

if __name__ == "__main__":
    main()
