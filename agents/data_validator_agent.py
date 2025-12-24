#!/usr/bin/env python3
"""
Data Validator Agent - Veri kalitesi kontrolü ve doğrulama asistanı.

Kullanım:
    python data_validator_agent.py "Hayrat verisini kontrol et"
    python data_validator_agent.py --interactive
"""

import asyncio
import json
import os
import re
import sys
from pathlib import Path
from typing import Any

# Agent SDK imports
from claude_agent_sdk import (
    ClaudeSDKClient,
    ClaudeAgentOptions,
    tool,
    create_sdk_mcp_server,
    AssistantMessage,
    TextBlock,
    ToolUseBlock
)

# Paths
PROJECT_DIR = Path(__file__).parent.parent
DATA_DIR = PROJECT_DIR / "src" / "data" / "quran"

# Beklenen ayet sayıları (Kur'an'da 6236 ayet var)
EXPECTED_VERSE_COUNTS = {
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

TOTAL_VERSES = 6236


def load_json(path: Path) -> Any:
    """JSON dosyası yükle."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


# ============= VALIDATOR TOOLS =============

@tool(
    "check_verse_coverage",
    "Bir çeviri/tefsir dosyasının ayet kapsamını kontrol eder",
    {"source": str}
)
async def check_verse_coverage(args: dict[str, Any]) -> dict[str, Any]:
    """Ayet kapsamı kontrolü."""
    source = args["source"]

    source_paths = {
        "hayrat": DATA_DIR / "hayrat_meal.json",
        "hayrat_tafsir": DATA_DIR / "hayrat_meal.json",
        "kuranyolu": DATA_DIR / "kuranyolu_commentary.json",
        "studyquran": DATA_DIR / "studyquran_commentary.json",
        "turkish": DATA_DIR / "quran_turkish.json",
        "english": DATA_DIR / "quran_english.json",
    }

    if source not in source_paths:
        return {
            "content": [{"type": "text", "text": f"Geçersiz kaynak. Seçenekler: {', '.join(source_paths.keys())}"}],
            "is_error": True
        }

    data = load_json(source_paths[source])
    if not data:
        return {
            "content": [{"type": "text", "text": "Veri yüklenemedi"}],
            "is_error": True
        }

    # Anahtarları topla
    if source == "hayrat":
        keys = set(data.get("translations", {}).keys())
    elif source == "hayrat_tafsir":
        keys = set(data.get("tafsir", {}).keys())
    elif source in ["kuranyolu", "studyquran"]:
        keys = set(data.keys())
    else:
        # Array format (surah-based)
        keys = set()
        for surah in data:
            surah_id = surah.get("id")
            for verse in surah.get("verses", []):
                keys.add(f"{surah_id}:{verse.get('id')}")

    # Eksik ayetleri bul
    missing = []
    for surah_id, verse_count in EXPECTED_VERSE_COUNTS.items():
        for verse_num in range(1, verse_count + 1):
            key = f"{surah_id}:{verse_num}"
            if key not in keys:
                missing.append(key)

    coverage = (len(keys) / TOTAL_VERSES) * 100

    result = {
        "source": source,
        "total_expected": TOTAL_VERSES,
        "found": len(keys),
        "missing_count": len(missing),
        "coverage_percent": round(coverage, 2),
        "missing_sample": missing[:20]  # İlk 20 eksik
    }

    return {
        "content": [{
            "type": "text",
            "text": json.dumps(result, ensure_ascii=False, indent=2)
        }]
    }


@tool(
    "check_html_issues",
    "Veri dosyalarındaki HTML artıklarını kontrol eder",
    {"source": str}
)
async def check_html_issues(args: dict[str, Any]) -> dict[str, Any]:
    """HTML sorunları kontrolü."""
    source = args["source"]

    source_paths = {
        "hayrat": DATA_DIR / "hayrat_meal.json",
        "kuranyolu": DATA_DIR / "kuranyolu_commentary.json",
        "studyquran": DATA_DIR / "studyquran_commentary.json",
    }

    if source not in source_paths:
        return {
            "content": [{"type": "text", "text": f"Geçersiz kaynak: {source}"}],
            "is_error": True
        }

    data = load_json(source_paths[source])
    if not data:
        return {
            "content": [{"type": "text", "text": "Veri yüklenemedi"}],
            "is_error": True
        }

    issues = {
        "span_tags": [],
        "div_tags": [],
        "entities": [],
        "other_tags": []
    }

    def check_text(text: str, key: str):
        if re.search(r"</?span", text, re.IGNORECASE):
            issues["span_tags"].append(key)
        if re.search(r"</?div", text, re.IGNORECASE):
            issues["div_tags"].append(key)
        if re.search(r"&[a-z]+;", text, re.IGNORECASE):
            issues["entities"].append(key)
        if re.search(r"<[a-z][^>]*>", text, re.IGNORECASE):
            issues["other_tags"].append(key)

    if source == "hayrat":
        for key, text in data.get("translations", {}).items():
            check_text(text, f"trans.{key}")
        for key, text in data.get("tafsir", {}).items():
            check_text(text, f"tafsir.{key}")
    else:
        for key, text in data.items():
            if isinstance(text, str):
                check_text(text, key)

    result = {
        "source": source,
        "span_tag_issues": len(issues["span_tags"]),
        "div_tag_issues": len(issues["div_tags"]),
        "entity_issues": len(issues["entities"]),
        "other_tag_issues": len(issues["other_tags"]),
        "samples": {
            "span": issues["span_tags"][:5],
            "div": issues["div_tags"][:5],
            "entities": issues["entities"][:5],
            "other": issues["other_tags"][:5]
        }
    }

    return {
        "content": [{
            "type": "text",
            "text": json.dumps(result, ensure_ascii=False, indent=2)
        }]
    }


@tool(
    "check_encoding",
    "Veri dosyalarındaki karakter encoding sorunlarını kontrol eder",
    {"source": str}
)
async def check_encoding(args: dict[str, Any]) -> dict[str, Any]:
    """Encoding kontrolü."""
    source = args["source"]

    path = DATA_DIR / f"{source}.json"
    if source == "hayrat":
        path = DATA_DIR / "hayrat_meal.json"

    if not path.exists():
        return {
            "content": [{"type": "text", "text": f"Dosya bulunamadı: {path}"}],
            "is_error": True
        }

    issues = []

    # Türkçe karakterler: İ, Ş, Ğ, Ü, Ö, Ç, ı, ş, ğ, ü, ö, ç
    turkish_chars = "İŞĞÜÖÇışğüöç"

    data = load_json(path)
    if not data:
        return {
            "content": [{"type": "text", "text": "Veri yüklenemedi"}],
            "is_error": True
        }

    def check_text(text: str, key: str):
        # Bozuk encoding belirtileri
        if "Ã" in text or "Ä" in text or "Å" in text:
            issues.append({"key": key, "issue": "possible_utf8_as_latin1"})
        if "�" in text:
            issues.append({"key": key, "issue": "replacement_character"})

    if source == "hayrat":
        for key, text in data.get("translations", {}).items():
            check_text(text, f"trans.{key}")
        for key, text in data.get("tafsir", {}).items():
            check_text(text, f"tafsir.{key}")
    elif isinstance(data, dict):
        for key, text in data.items():
            if isinstance(text, str):
                check_text(text, key)
    elif isinstance(data, list):
        for i, item in enumerate(data):
            if isinstance(item, dict):
                for key, value in item.items():
                    if isinstance(value, str):
                        check_text(value, f"[{i}].{key}")

    result = {
        "source": source,
        "encoding_issues": len(issues),
        "issues": issues[:20]
    }

    return {
        "content": [{
            "type": "text",
            "text": json.dumps(result, ensure_ascii=False, indent=2)
        }]
    }


@tool(
    "validate_references",
    "Hayrat mealindeki referans eşleştirmelerini kontrol eder",
    {}
)
async def validate_references(args: dict[str, Any]) -> dict[str, Any]:
    """Referans eşleştirme kontrolü."""

    hayrat_path = DATA_DIR / "hayrat_meal.json"
    data = load_json(hayrat_path)

    if not data:
        return {
            "content": [{"type": "text", "text": "Hayrat verisi yüklenemedi"}],
            "is_error": True
        }

    translations = data.get("translations", {})
    tafsir = data.get("tafsir", {})

    stats = {
        "translations_with_refs": 0,
        "translations_with_tafsir": 0,
        "orphan_refs": [],  # Referansı olan ama tefsiri olmayan
        "ref_pattern": re.compile(r"\((\d+)\)")
    }

    for key, text in translations.items():
        refs = stats["ref_pattern"].findall(text)
        if refs:
            stats["translations_with_refs"] += 1
            if key in tafsir:
                stats["translations_with_tafsir"] += 1
            else:
                stats["orphan_refs"].append({
                    "key": key,
                    "refs": refs
                })

    result = {
        "total_translations": len(translations),
        "translations_with_references": stats["translations_with_refs"],
        "translations_with_tafsir": stats["translations_with_tafsir"],
        "match_rate": round((stats["translations_with_tafsir"] / max(1, stats["translations_with_refs"])) * 100, 2),
        "orphan_refs_count": len(stats["orphan_refs"]),
        "orphan_samples": stats["orphan_refs"][:10]
    }

    return {
        "content": [{
            "type": "text",
            "text": json.dumps(result, ensure_ascii=False, indent=2)
        }]
    }


# ============= AGENT SETUP =============

validator_server = create_sdk_mcp_server(
    name="validator",
    version="1.0.0",
    tools=[check_verse_coverage, check_html_issues, check_encoding, validate_references]
)

SYSTEM_PROMPT = """Sen veri kalitesi kontrolü konusunda uzmanlaşmış bir yapay zeka asistanısın.

## Görevlerin:
1. Veri bütünlüğünü kontrol etmek
2. Eksik ayetleri tespit etmek
3. HTML artıklarını bulmak
4. Encoding sorunlarını tespit etmek
5. Referans eşleştirmelerini doğrulamak

## Kontrol Edilecek Kaynaklar:
- Hayrat Neşriyat (meal + tefsir)
- Kur'an Yolu (tefsir)
- Study Quran (çeviri + tefsir)
- Diyanet, Elmalili, vs.

## Beklenen Değerler:
- Toplam ayet: 6236
- Sure sayısı: 114
- Fatiha: 7 ayet
- Bakara: 286 ayet

## Kuralların:
- Sorunları net raporla
- Çözüm önerileri sun
- Kritik sorunları öncelikle belirt
- Karşılaştırmalı analiz yap

## Mevcut Tool'lar:
- check_verse_coverage: Ayet kapsamı
- check_html_issues: HTML artıkları
- check_encoding: Encoding sorunları
- validate_references: Referans eşleştirme"""


class DataValidatorAgent:
    """Veri kalitesi kontrol asistanı."""

    def __init__(self):
        self.options = ClaudeAgentOptions(
            allowed_tools=[
                "mcp__validator__check_verse_coverage",
                "mcp__validator__check_html_issues",
                "mcp__validator__check_encoding",
                "mcp__validator__validate_references",
            ],
            permission_mode="acceptEdits",
            system_prompt=SYSTEM_PROMPT,
            mcp_servers={"validator": validator_server}
        )

    async def ask(self, question: str) -> str:
        """Tek soru sor ve cevap al."""
        response_text = []

        async with ClaudeSDKClient(options=self.options) as client:
            await client.query(question)

            async for message in client.receive_response():
                if isinstance(message, AssistantMessage):
                    for block in message.content:
                        if isinstance(block, TextBlock):
                            response_text.append(block.text)
                        elif isinstance(block, ToolUseBlock):
                            response_text.append(f"\n[Tool: {block.name}]\n")

        return "\n".join(response_text)

    async def interactive(self):
        """İnteraktif mod."""
        print("=" * 60)
        print("Data Validator Agent - Veri Kalitesi Kontrolü")
        print("Çıkmak için 'quit' yazın")
        print("=" * 60)

        async with ClaudeSDKClient(options=self.options) as client:
            while True:
                try:
                    user_input = input("\n🔍 Kontrol: ").strip()

                    if user_input.lower() in ["quit", "exit", "q"]:
                        print("Çıkış yapılıyor...")
                        break

                    if not user_input:
                        continue

                    print("\n📋 Rapor:")
                    await client.query(user_input)

                    async for message in client.receive_response():
                        if isinstance(message, AssistantMessage):
                            for block in message.content:
                                if isinstance(block, TextBlock):
                                    print(block.text)
                                elif isinstance(block, ToolUseBlock):
                                    print(f"  [Tool: {block.name}]")

                except KeyboardInterrupt:
                    print("\n\nÇıkış yapılıyor...")
                    break
                except Exception as e:
                    print(f"Hata: {e}")


async def main():
    agent = DataValidatorAgent()

    if len(sys.argv) > 1:
        if sys.argv[1] in ["--interactive", "-i"]:
            await agent.interactive()
        else:
            question = " ".join(sys.argv[1:])
            response = await agent.ask(question)
            print(response)
    else:
        await agent.interactive()


if __name__ == "__main__":
    asyncio.run(main())
