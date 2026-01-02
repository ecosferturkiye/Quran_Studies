#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

"""
Türkçe Meal Agent
Elmalılı ve Hayrat meallerini birleştirerek zenginleştirilmiş Türkçe meal üretir.

Kaynaklar:
- Elmalılı Muhammed Hamdi Yazır - Hak Dini Kur'an Dili (Meal + Tefsir)
- Hayrat Neşriyat Meali (Meal + Risale-i Nur Tefsiri)

Kullanım:
  python meal_agent.py --surah 1              # Fatiha suresi
  python meal_agent.py --surah 2 --ayah 255   # Ayetel Kürsi
  python meal_agent.py --range 1:1-7          # Fatiha 1-7
  python meal_agent.py --export all           # Tüm Kur'an'ı JSON olarak çıkar
"""

import json
import argparse
import requests
from pathlib import Path
from typing import Optional, Dict, List, Any

# Veri dosyaları
DATA_DIR = Path(__file__).parent.parent / "src" / "data" / "quran"
ELMALILI_TEFSIR_FILE = DATA_DIR / "elmalili_tefsir.json"
HAYRAT_MEAL_FILE = DATA_DIR / "hayrat_meal.json"
OUTPUT_DIR = Path(__file__).parent.parent / "src" / "data" / "quran"

# quran.com API
QURAN_API_BASE = "https://api.quran.com/api/v4"
ELMALILI_TRANSLATION_ID = 52

# Sure bilgileri
SURAH_INFO = {
    1: {"name": "Fatiha", "name_ar": "الفاتحة", "ayah_count": 7},
    2: {"name": "Bakara", "name_ar": "البقرة", "ayah_count": 286},
    3: {"name": "Al-i İmran", "name_ar": "آل عمران", "ayah_count": 200},
    4: {"name": "Nisa", "name_ar": "النساء", "ayah_count": 176},
    5: {"name": "Maide", "name_ar": "المائدة", "ayah_count": 120},
    6: {"name": "En'am", "name_ar": "الأنعام", "ayah_count": 165},
    7: {"name": "A'raf", "name_ar": "الأعراف", "ayah_count": 206},
    8: {"name": "Enfal", "name_ar": "الأنفال", "ayah_count": 75},
    9: {"name": "Tevbe", "name_ar": "التوبة", "ayah_count": 129},
    10: {"name": "Yunus", "name_ar": "يونس", "ayah_count": 109},
    # ... diğer sureler için genişletilebilir
}


class MealAgent:
    """Türkçe Meal Agent - Elmalılı ve Hayrat meallerini birleştirir"""

    def __init__(self):
        self.elmalili_tefsir = self._load_elmalili_tefsir()
        self.hayrat_data = self._load_hayrat_data()
        self._elmalili_meal_cache = {}

    def _load_elmalili_tefsir(self) -> Dict:
        """Elmalılı tefsirini yükle"""
        if ELMALILI_TEFSIR_FILE.exists():
            with open(ELMALILI_TEFSIR_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {"surahs": {}}

    def _load_hayrat_data(self) -> Dict:
        """Hayrat mealini yükle"""
        if HAYRAT_MEAL_FILE.exists():
            with open(HAYRAT_MEAL_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {"translations": {}, "tafsir": {}}

    def get_elmalili_meal(self, surah_id: int, ayah_id: Optional[int] = None) -> Dict[int, str]:
        """quran.com API'den Elmalılı mealini çek"""
        cache_key = f"{surah_id}"

        if cache_key not in self._elmalili_meal_cache:
            try:
                url = f"{QURAN_API_BASE}/verses/by_chapter/{surah_id}?translations={ELMALILI_TRANSLATION_ID}&per_page=300"
                response = requests.get(url, timeout=30)
                response.raise_for_status()
                data = response.json()

                meals = {}
                for verse in data.get("verses", []):
                    verse_num = verse.get("verse_number")
                    translations = verse.get("translations", [])
                    if translations:
                        text = translations[0].get("text", "")
                        # HTML etiketlerini temizle
                        import re
                        text = re.sub(r'<[^>]+>', '', text)
                        meals[verse_num] = text.strip()

                self._elmalili_meal_cache[cache_key] = meals
            except Exception as e:
                print(f"[HATA] Elmalılı meali çekilemedi: {e}")
                self._elmalili_meal_cache[cache_key] = {}

        result = self._elmalili_meal_cache[cache_key]

        if ayah_id:
            return {ayah_id: result.get(ayah_id, "")}
        return result

    def get_elmalili_tefsir(self, surah_id: int) -> str:
        """Elmalılı tefsirini getir (sure bazlı)"""
        surah_data = self.elmalili_tefsir.get("surahs", {}).get(str(surah_id), {})
        return surah_data.get("tefsir", "")

    def get_hayrat_meal(self, surah_id: int, ayah_id: int) -> str:
        """Hayrat mealini getir"""
        key = f"{surah_id}:{ayah_id}"
        return self.hayrat_data.get("translations", {}).get(key, "")

    def get_hayrat_tefsir(self, surah_id: int, ayah_id: int) -> str:
        """Hayrat tefsirini getir"""
        key = f"{surah_id}:{ayah_id}"
        return self.hayrat_data.get("tafsir", {}).get(key, "")

    def get_verse(self, surah_id: int, ayah_id: int) -> Dict[str, Any]:
        """Tek bir ayet için tüm verileri getir"""
        return {
            "surah_id": surah_id,
            "ayah_id": ayah_id,
            "verse_key": f"{surah_id}:{ayah_id}",
            "elmalili_meal": self.get_elmalili_meal(surah_id, ayah_id).get(ayah_id, ""),
            "hayrat_meal": self.get_hayrat_meal(surah_id, ayah_id),
            "hayrat_tefsir": self.get_hayrat_tefsir(surah_id, ayah_id),
        }

    def get_surah(self, surah_id: int) -> Dict[str, Any]:
        """Bir sure için tüm verileri getir"""
        elmalili_meals = self.get_elmalili_meal(surah_id)
        elmalili_tefsir = self.get_elmalili_tefsir(surah_id)

        verses = []
        for ayah_id in sorted(elmalili_meals.keys()):
            verses.append({
                "ayah_id": ayah_id,
                "verse_key": f"{surah_id}:{ayah_id}",
                "elmalili_meal": elmalili_meals.get(ayah_id, ""),
                "hayrat_meal": self.get_hayrat_meal(surah_id, ayah_id),
                "hayrat_tefsir": self.get_hayrat_tefsir(surah_id, ayah_id),
            })

        surah_info = SURAH_INFO.get(surah_id, {"name": f"Sure {surah_id}"})

        return {
            "surah_id": surah_id,
            "surah_name": surah_info.get("name", f"Sure {surah_id}"),
            "surah_name_ar": surah_info.get("name_ar", ""),
            "ayah_count": len(verses),
            "verses": verses,
            "elmalili_tefsir": elmalili_tefsir,
        }

    def format_verse_markdown(self, verse: Dict) -> str:
        """Ayeti Markdown formatında döndür"""
        lines = []
        lines.append(f"### {verse['verse_key']}")
        lines.append("")

        # Elmalılı Meali
        if verse.get("elmalili_meal"):
            lines.append(f"**Elmalılı Meali:**")
            lines.append(f"> {verse['elmalili_meal']}")
            lines.append("")

        # Hayrat Meali
        if verse.get("hayrat_meal"):
            lines.append(f"**Hayrat Meali:**")
            lines.append(f"> {verse['hayrat_meal']}")
            lines.append("")

        # Hayrat Tefsiri (dipnot)
        if verse.get("hayrat_tefsir"):
            lines.append(f"**Dipnot (Hayrat):**")
            lines.append(f"_{verse['hayrat_tefsir']}_")
            lines.append("")

        return "\n".join(lines)

    def format_surah_markdown(self, surah: Dict) -> str:
        """Sureyi Markdown formatında döndür"""
        lines = []
        lines.append(f"# {surah['surah_id']}. {surah['surah_name']}")
        if surah.get("surah_name_ar"):
            lines.append(f"## {surah['surah_name_ar']}")
        lines.append("")
        lines.append(f"*{surah['ayah_count']} ayet*")
        lines.append("")
        lines.append("---")
        lines.append("")

        # Ayetler
        for verse in surah.get("verses", []):
            lines.append(self.format_verse_markdown(verse))

        # Sure tefsiri
        if surah.get("elmalili_tefsir"):
            lines.append("---")
            lines.append("")
            lines.append("## Elmalılı Tefsiri")
            lines.append("")
            # İlk 2000 karakteri göster (çok uzun olabilir)
            tefsir = surah["elmalili_tefsir"]
            if len(tefsir) > 2000:
                lines.append(tefsir[:2000] + "...")
                lines.append("")
                lines.append(f"*[Toplam {len(tefsir):,} karakter - devamı için tam dosyaya bakınız]*")
            else:
                lines.append(tefsir)

        return "\n".join(lines)

    def export_combined_meal(self, output_file: Optional[Path] = None) -> Dict:
        """Tüm Kur'an için birleşik meal JSON dosyası oluştur"""
        if output_file is None:
            output_file = OUTPUT_DIR / "combined_turkish_meal.json"

        result = {
            "metadata": {
                "title": "Birleşik Türkçe Kur'an Meali",
                "sources": [
                    {
                        "name": "Elmalılı Muhammed Hamdi Yazır",
                        "work": "Hak Dini Kur'an Dili",
                        "type": "Meal + Tefsir (Sure bazlı)"
                    },
                    {
                        "name": "Hayrat Neşriyat",
                        "work": "Kur'an-ı Kerim Meali",
                        "type": "Meal + Tefsir (Ayet bazlı, Risale-i Nur referansları)"
                    }
                ],
                "note": "Bu meal, iki farklı kaynaktan derlenmiştir. Tefsirler referans amaçlıdır.",
            },
            "surahs": {}
        }

        print("Birleşik meal oluşturuluyor...")

        for surah_id in range(1, 115):
            print(f"  Sure {surah_id}...", end=" ", flush=True)
            try:
                surah_data = self.get_surah(surah_id)
                result["surahs"][str(surah_id)] = surah_data
                print(f"{len(surah_data['verses'])} ayet")
            except Exception as e:
                print(f"HATA: {e}")

        # Kaydet
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        print(f"\nKaydedildi: {output_file}")
        return result


def main():
    parser = argparse.ArgumentParser(description="Türkçe Meal Agent")
    parser.add_argument("--surah", type=int, help="Sure numarası (1-114)")
    parser.add_argument("--ayah", type=int, help="Ayet numarası")
    parser.add_argument("--range", type=str, help="Ayet aralığı (örn: 2:255-256)")
    parser.add_argument("--export", type=str, help="Tümünü dışa aktar: 'all' veya 'json'")
    parser.add_argument("--format", type=str, default="markdown", choices=["markdown", "json"], help="Çıktı formatı")

    args = parser.parse_args()
    agent = MealAgent()

    if args.export:
        agent.export_combined_meal()
        return

    if args.surah:
        if args.ayah:
            # Tek ayet
            verse = agent.get_verse(args.surah, args.ayah)
            if args.format == "json":
                print(json.dumps(verse, ensure_ascii=False, indent=2))
            else:
                print(agent.format_verse_markdown(verse))
        else:
            # Tüm sure
            surah = agent.get_surah(args.surah)
            if args.format == "json":
                print(json.dumps(surah, ensure_ascii=False, indent=2))
            else:
                print(agent.format_surah_markdown(surah))
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
