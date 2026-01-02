#!/usr/bin/env python3
"""
Elmalılı Hamdi Yazır Tefsiri Scraper
Kaynak: enfal.de (kuranikerim.com mirror)
"""

import requests
import json
import re
import time
import os
from bs4 import BeautifulSoup
from pathlib import Path

# Çıktı dizini
OUTPUT_DIR = Path(__file__).parent.parent / "src" / "data" / "quran"
OUTPUT_FILE = OUTPUT_DIR / "elmalili_tefsir.json"
CACHE_DIR = Path(__file__).parent / "cache_elmalili"

# Site bilgileri
BASE_URL = "http://www.enfal.de/telmalili"

# Sure bilgileri (index sayfasından çıkarıldı)
SURAH_PAGES = {
    1: ["fatiha.htm"],
    2: ["bakara1.htm", "bakara2.htm", "bakara3.htm"],
    3: ["imran.htm"],
    4: ["nisa.htm"],
    5: ["maide.htm"],
    6: ["enam.htm"],
    7: ["araf.htm"],
    8: ["enfal.htm"],
    9: ["tevbe.htm"],
    10: ["yunus.htm"],
    11: ["hud.htm"],
    12: ["yusuf.htm"],
    13: ["rad.htm"],
    14: ["ibrahim.htm"],
    15: ["hicr.htm"],
    16: ["nahl.htm"],
    17: ["isra.htm"],
    18: ["kehf.htm"],
    19: ["meryem.htm"],
    20: ["taha.htm"],
    21: ["enbiya.htm"],
    22: ["hac.htm"],
    23: ["muminun.htm"],
    24: ["nur.htm"],
    25: ["furkan.htm"],
    26: ["suara.htm"],
    27: ["neml.htm"],
    28: ["kasas.htm"],
    29: ["ankebut.htm"],
    30: ["rum.htm"],
    31: ["lokman.htm"],
    32: ["secde.htm"],
    33: ["ahzab.htm"],
    34: ["sebe.htm"],
    35: ["fatir.htm"],
    36: ["yasin.htm"],
    37: ["saffat.htm"],
    38: ["sad.htm"],
    39: ["zumer.htm"],
    40: ["mumin.htm"],
    41: ["fussilet.htm"],
    42: ["sura.htm"],
    43: ["zuhruf.htm"],
    44: ["duhan.htm"],
    45: ["casiye.htm"],
    46: ["ahkaf.htm"],
    47: ["muhammed.htm"],
    48: ["fetih.htm"],
    49: ["hucurat.htm"],
    50: ["kaf.htm"],
    51: ["zariyat.htm"],
    52: ["tur.htm"],
    53: ["necm.htm"],
    54: ["kamer.htm"],
    55: ["rahman.htm"],
    56: ["vakia.htm"],
    57: ["hadid.htm"],
    58: ["mucadele.htm"],
    59: ["hasr.htm"],
    60: ["mumtehine.htm"],
    61: ["saf.htm"],
    62: ["cuma.htm"],
    63: ["munafikun.htm"],
    64: ["tegabun.htm"],
    65: ["talak.htm"],
    66: ["tahrim.htm"],
    67: ["mulk.htm"],
    68: ["kalem.htm"],
    69: ["hakka.htm"],
    70: ["mearic.htm"],
    71: ["nuh.htm"],
    72: ["cin.htm"],
    73: ["muzzemmil.htm"],
    74: ["muddessir.htm"],
    75: ["kiyame.htm"],
    76: ["insan.htm"],
    77: ["murselat.htm"],
    78: ["nebe.htm"],
    79: ["naziat.htm"],
    80: ["abese.htm"],
    81: ["tekvir.htm"],
    82: ["infitar.htm"],
    83: ["mutaffifin.htm"],
    84: ["insikak.htm"],
    85: ["buruc.htm"],
    86: ["tarik.htm"],
    87: ["ala.htm"],
    88: ["gasiye.htm"],
    89: ["fecr.htm"],
    90: ["beled.htm"],
    91: ["sems.htm"],
    92: ["leyl.htm"],
    93: ["duha.htm"],
    94: ["insirah.htm"],
    95: ["tin.htm"],
    96: ["alak.htm"],
    97: ["kadir.htm"],
    98: ["beyyine.htm"],
    99: ["zilzal.htm"],
    100: ["adiyat.htm"],
    101: ["karia.htm"],
    102: ["tekasur.htm"],
    103: ["asr.htm"],
    104: ["humeze.htm"],
    105: ["fil.htm"],
    106: ["kureys.htm"],
    107: ["maun.htm"],
    108: ["kevser.htm"],
    109: ["kafirun.htm"],
    110: ["nasr.htm"],
    111: ["tebbet.htm"],
    112: ["ihlas.htm"],
    113: ["felak.htm"],
    114: ["nas.htm"],
}

# Sure isimleri
SURAH_NAMES = {
    1: "Fatiha", 2: "Bakara", 3: "Al-i İmran", 4: "Nisa", 5: "Maide",
    6: "En'am", 7: "A'raf", 8: "Enfal", 9: "Tevbe", 10: "Yunus",
    11: "Hud", 12: "Yusuf", 13: "Ra'd", 14: "İbrahim", 15: "Hicr",
    16: "Nahl", 17: "İsra", 18: "Kehf", 19: "Meryem", 20: "Taha",
    21: "Enbiya", 22: "Hac", 23: "Mü'minun", 24: "Nur", 25: "Furkan",
    26: "Şuara", 27: "Neml", 28: "Kasas", 29: "Ankebut", 30: "Rum",
    31: "Lokman", 32: "Secde", 33: "Ahzab", 34: "Sebe", 35: "Fatır",
    36: "Yasin", 37: "Saffat", 38: "Sad", 39: "Zümer", 40: "Mü'min",
    41: "Fussilet", 42: "Şura", 43: "Zuhruf", 44: "Duhan", 45: "Casiye",
    46: "Ahkaf", 47: "Muhammed", 48: "Fetih", 49: "Hucurat", 50: "Kaf",
    51: "Zariyat", 52: "Tur", 53: "Necm", 54: "Kamer", 55: "Rahman",
    56: "Vakıa", 57: "Hadid", 58: "Mücadele", 59: "Haşr", 60: "Mümtehine",
    61: "Saf", 62: "Cuma", 63: "Münafikun", 64: "Tegabün", 65: "Talak",
    66: "Tahrim", 67: "Mülk", 68: "Kalem", 69: "Hakka", 70: "Mearic",
    71: "Nuh", 72: "Cin", 73: "Müzzemmil", 74: "Müddessir", 75: "Kıyame",
    76: "İnsan", 77: "Mürselat", 78: "Nebe", 79: "Naziat", 80: "Abese",
    81: "Tekvir", 82: "İnfitar", 83: "Mutaffifin", 84: "İnşikak", 85: "Büruc",
    86: "Tarık", 87: "A'la", 88: "Gaşiye", 89: "Fecr", 90: "Beled",
    91: "Şems", 92: "Leyl", 93: "Duha", 94: "İnşirah", 95: "Tin",
    96: "Alak", 97: "Kadr", 98: "Beyyine", 99: "Zilzal", 100: "Adiyat",
    101: "Karia", 102: "Tekasür", 103: "Asr", 104: "Hümeze", 105: "Fil",
    106: "Kureyş", 107: "Maun", 108: "Kevser", 109: "Kafirun", 110: "Nasr",
    111: "Tebbet", 112: "İhlas", 113: "Felak", 114: "Nas",
}


def decode_windows1254(content: bytes) -> str:
    """Windows-1254 (Türkçe) kodlamasını UTF-8'e çevir"""
    try:
        return content.decode('windows-1254')
    except:
        try:
            return content.decode('iso-8859-9')
        except:
            return content.decode('utf-8', errors='ignore')


def clean_text(text: str) -> str:
    """HTML ve gereksiz karakterleri temizle"""
    # HTML entities
    text = text.replace('&nbsp;', ' ')
    text = text.replace('&quot;', '"')
    text = text.replace('&amp;', '&')
    text = text.replace('&lt;', '<')
    text = text.replace('&gt;', '>')

    # Fazla boşlukları temizle
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()

    return text


def fetch_page(url: str, use_cache: bool = True) -> str:
    """Sayfayı indir veya cache'den oku"""
    # Cache dosya adı
    cache_file = CACHE_DIR / url.split('/')[-1]

    if use_cache and cache_file.exists():
        print(f"  [CACHE] {url}")
        with open(cache_file, 'r', encoding='utf-8') as f:
            return f.read()

    print(f"  [FETCH] {url}")
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()

        # Decode
        html = decode_windows1254(response.content)

        # Cache'e kaydet
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        with open(cache_file, 'w', encoding='utf-8') as f:
            f.write(html)

        # Rate limiting
        time.sleep(0.2)

        return html
    except Exception as e:
        print(f"  [ERROR] {url}: {e}")
        return ""


def extract_tefsir(html: str) -> str:
    """HTML'den tefsir metnini çıkar"""
    soup = BeautifulSoup(html, 'html.parser')

    # blockquote içindeki metni al
    blockquote = soup.find('blockquote')
    if not blockquote:
        # Alternatif: body içindeki tüm metin
        blockquote = soup.find('body')

    if not blockquote:
        return ""

    # Sadece <p> taglarını al (span'lar zaten p içinde)
    paragraphs = []
    for p in blockquote.find_all('p'):
        text = p.get_text()
        text = clean_text(text)
        if text and len(text) > 10:  # Çok kısa metinleri atla
            paragraphs.append(text)

    return '\n\n'.join(paragraphs)


def fetch_surah(surah_id: int) -> dict:
    """Bir surenin tüm sayfalarını indir ve birleştir"""
    pages = SURAH_PAGES.get(surah_id, [])
    if not pages:
        return None

    all_text = []

    for page in pages:
        url = f"{BASE_URL}/{page}"
        html = fetch_page(url)
        if html:
            tefsir = extract_tefsir(html)
            if tefsir:
                all_text.append(tefsir)

    if not all_text:
        return None

    return {
        "surah_id": surah_id,
        "surah_name": SURAH_NAMES.get(surah_id, f"Sure {surah_id}"),
        "pages": pages,
        "tefsir": '\n\n'.join(all_text)
    }


def main():
    """Ana fonksiyon"""
    print("=" * 60)
    print("Elmalılı Hamdi Yazır Tefsiri Scraper")
    print("Kaynak: enfal.de")
    print("=" * 60)

    # Sonuçları topla
    result = {
        "metadata": {
            "source": "Elmalılı Muhammed Hamdi Yazır - Hak Dini Kur'an Dili",
            "scraped_from": "enfal.de (kuranikerim.com mirror)",
            "type": "Türkçe Tefsir",
            "note": "Sure bazlı tefsir metinleri. Ayet ayrımı yapılmamıştır.",
        },
        "surahs": {}
    }

    # Her sureyi indir
    total = len(SURAH_PAGES)
    for idx, surah_id in enumerate(sorted(SURAH_PAGES.keys()), 1):
        print(f"\n[{idx}/{total}] Sure {surah_id}: {SURAH_NAMES.get(surah_id, '')}")

        surah_data = fetch_surah(surah_id)
        if surah_data:
            result["surahs"][str(surah_id)] = surah_data
            print(f"  [OK] {len(surah_data['tefsir'])} karakter")
        else:
            print(f"  [FAIL] Veri bulunamadi")

        # Her 10 surede bir ara kayıt
        if idx % 10 == 0:
            print(f"\n  [BACKUP] Ara kayıt yapılıyor...")
            with open(OUTPUT_FILE.with_suffix('.backup.json'), 'w', encoding='utf-8') as f:
                json.dump(result, f, ensure_ascii=False, indent=2)

    # Sonucu kaydet
    print("\n" + "=" * 60)
    print(f"Kaydediliyor: {OUTPUT_FILE}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    # İstatistikler
    total_chars = sum(len(s.get('tefsir', '')) for s in result['surahs'].values())
    print(f"\nToplam: {len(result['surahs'])} sure, {total_chars:,} karakter")
    print("=" * 60)


if __name__ == "__main__":
    main()
