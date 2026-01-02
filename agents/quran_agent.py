#!/usr/bin/env python3
"""
Quran Agent - Kur'an verilerine erişim ve öğrenme desteği sağlayan AI agent.

Kullanım:
    python quran_agent.py "Fatiha suresinin 1. ayetini açıkla"
    python quran_agent.py --interactive
"""

import asyncio
import json
import os
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

# Data paths
DATA_DIR = Path(__file__).parent.parent / "src" / "data"
QURAN_DIR = DATA_DIR / "quran"
QURAN_MASTER_DIR = DATA_DIR / "quran-master"
LEARNING_DIR = DATA_DIR / "learning"


def load_json(file_path: Path) -> Any:
    """JSON dosyası yükle."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


# ============= QURAN TOOLS =============

@tool(
    "get_verse",
    "Belirli bir ayeti tüm çevirileriyle birlikte getirir",
    {"surah": int, "ayah": int}
)
async def get_verse(args: dict[str, Any]) -> dict[str, Any]:
    """Ayet getir."""
    surah = args["surah"]
    ayah = args["ayah"]

    try:
        arabic = load_json(QURAN_DIR / "quran_arabic.json") or []
        turkish = load_json(QURAN_DIR / "quran_turkish.json") or []
        english = load_json(QURAN_DIR / "quran_english.json") or []
        haleem = load_json(QURAN_DIR / "quran_haleem.json") or {}
        clearquran = load_json(QURAN_DIR / "quran_clearquran.json") or {}
        studyquran = load_json(QURAN_DIR / "quran_studyquran.json") or {}

        # Arabic text
        surah_data = next((s for s in arabic if s.get("id") == surah), None)
        arabic_text = ""
        if surah_data:
            verse = next((v for v in surah_data.get("verses", []) if v.get("id") == ayah), None)
            arabic_text = verse.get("text", "") if verse else ""

        # Turkish
        turkish_text = ""
        tr_surah = next((s for s in turkish if s.get("id") == surah), None)
        if tr_surah:
            tr_verse = next((v for v in tr_surah.get("verses", []) if v.get("id") == ayah), None)
            turkish_text = tr_verse.get("translation", "") if tr_verse else ""

        # English
        english_text = ""
        en_surah = next((s for s in english if s.get("id") == surah), None)
        if en_surah:
            en_verse = next((v for v in en_surah.get("verses", []) if v.get("id") == ayah), None)
            english_text = en_verse.get("translation", "") if en_verse else ""

        # Flat format translations
        haleem_text = haleem.get(str(surah), {}).get(str(ayah), "")
        clearquran_text = clearquran.get(str(surah), {}).get(str(ayah), "")
        studyquran_text = studyquran.get(str(surah), {}).get(str(ayah), "")

        result = {
            "verse_key": f"{surah}:{ayah}",
            "arabic": arabic_text,
            "translations": {
                "turkish_diyanet": turkish_text,
                "english_sahih": english_text,
                "english_haleem": haleem_text,
                "english_clearquran": clearquran_text,
                "english_studyquran": studyquran_text,
            }
        }

        return {
            "content": [{
                "type": "text",
                "text": json.dumps(result, ensure_ascii=False, indent=2)
            }]
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Hata: {e}"}],
            "is_error": True
        }


@tool(
    "search_quran",
    "Kur'an'da anahtar kelime araması yapar",
    {"query": str, "limit": int}
)
async def search_quran(args: dict[str, Any]) -> dict[str, Any]:
    """Kur'an'da arama yap."""
    query = args["query"].lower()
    limit = args.get("limit", 10)

    try:
        arabic = load_json(QURAN_DIR / "quran_arabic.json") or []
        turkish = load_json(QURAN_DIR / "quran_turkish.json") or []
        english = load_json(QURAN_DIR / "quran_english.json") or []

        results = []

        for surah in arabic:
            surah_id = surah.get("id")
            tr_surah = next((s for s in turkish if s.get("id") == surah_id), {})
            en_surah = next((s for s in english if s.get("id") == surah_id), {})

            for verse in surah.get("verses", []):
                ayah_id = verse.get("id")

                tr_verse = next((v for v in tr_surah.get("verses", []) if v.get("id") == ayah_id), {})
                en_verse = next((v for v in en_surah.get("verses", []) if v.get("id") == ayah_id), {})

                search_text = " ".join([
                    verse.get("text", ""),
                    tr_verse.get("translation", ""),
                    en_verse.get("translation", ""),
                ]).lower()

                if query in search_text:
                    results.append({
                        "verse_key": f"{surah_id}:{ayah_id}",
                        "arabic": verse.get("text", ""),
                        "turkish": tr_verse.get("translation", ""),
                        "english": en_verse.get("translation", ""),
                    })

                    if len(results) >= limit:
                        break

            if len(results) >= limit:
                break

        return {
            "content": [{
                "type": "text",
                "text": json.dumps({"count": len(results), "results": results}, ensure_ascii=False, indent=2)
            }]
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Hata: {e}"}],
            "is_error": True
        }


@tool(
    "get_word_details",
    "Bir ayetin kelime kelime analizini ve zamanlamalarını getirir",
    {"surah": int, "ayah": int}
)
async def get_word_details(args: dict[str, Any]) -> dict[str, Any]:
    """Kelime detayları getir."""
    surah = args["surah"]
    ayah = args["ayah"]

    try:
        surah_file = QURAN_MASTER_DIR / f"surah-{str(surah).zfill(3)}.json"
        surah_data = load_json(surah_file)

        if not surah_data or "verses" not in surah_data:
            return {
                "content": [{"type": "text", "text": "Kelime verisi bulunamadı"}],
                "is_error": True
            }

        verse_data = next((v for v in surah_data["verses"] if v.get("verseNumber") == ayah), None)

        if not verse_data:
            return {
                "content": [{"type": "text", "text": "Ayet bulunamadı"}],
                "is_error": True
            }

        words = []
        for w in verse_data.get("words", []):
            words.append({
                "arabic": w.get("arabic", ""),
                "root": w.get("rootArabic", ""),
                "translations": w.get("translations", {}),
                "start_time": w.get("startTime"),
                "end_time": w.get("endTime"),
            })

        return {
            "content": [{
                "type": "text",
                "text": json.dumps({
                    "verse_key": f"{surah}:{ayah}",
                    "word_count": len(words),
                    "words": words
                }, ensure_ascii=False, indent=2)
            }]
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Hata: {e}"}],
            "is_error": True
        }


@tool(
    "get_vocabulary",
    "Kur'an kelime öğrenme listesini getirir",
    {"category": str, "limit": int}
)
async def get_vocabulary(args: dict[str, Any]) -> dict[str, Any]:
    """Kelime listesi getir."""
    category = args["category"]  # words, twogram, threegram
    limit = args.get("limit", 20)

    try:
        if category == "words":
            data = load_json(LEARNING_DIR / "words_300.json")
        elif category == "twogram":
            data = load_json(LEARNING_DIR / "twogram.json")
        elif category == "threegram":
            data = load_json(LEARNING_DIR / "threegram.json")
        else:
            return {
                "content": [{"type": "text", "text": "Geçersiz kategori. Seçenekler: words, twogram, threegram"}],
                "is_error": True
            }

        if not data:
            return {
                "content": [{"type": "text", "text": "Veri bulunamadı"}],
                "is_error": True
            }

        items = list(data.values())[:limit] if isinstance(data, dict) else data[:limit]

        return {
            "content": [{
                "type": "text",
                "text": json.dumps({
                    "category": category,
                    "count": len(items),
                    "items": items
                }, ensure_ascii=False, indent=2)
            }]
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Hata: {e}"}],
            "is_error": True
        }


@tool(
    "get_surah_list",
    "Tüm surelerin listesini getirir",
    {}
)
async def get_surah_list(args: dict[str, Any]) -> dict[str, Any]:
    """Sure listesi getir."""
    try:
        arabic = load_json(QURAN_DIR / "quran_arabic.json") or []

        surahs = []
        for s in arabic:
            surahs.append({
                "number": s.get("id"),
                "name": s.get("name"),
                "verse_count": len(s.get("verses", []))
            })

        return {
            "content": [{
                "type": "text",
                "text": json.dumps({"count": len(surahs), "surahs": surahs}, ensure_ascii=False, indent=2)
            }]
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Hata: {e}"}],
            "is_error": True
        }


# ============= AGENT SETUP =============

# Create MCP server with Quran tools
quran_server = create_sdk_mcp_server(
    name="quran",
    version="1.0.0",
    tools=[get_verse, search_quran, get_word_details, get_vocabulary, get_surah_list]
)

SYSTEM_PROMPT = """Sen Kur'an-ı Kerim konusunda uzmanlaşmış bir yapay zeka asistanısın.

## Görevlerin:
1. Ayetleri açıklamak ve yorumlamak
2. Arapça kelimelerin köklerini ve anlamlarını açıklamak
3. Çeviriler arasındaki farkları karşılaştırmak
4. Tecvid kuralları hakkında bilgi vermek
5. Öğrenme tavsiyelerinde bulunmak

## Kuralların:
- Her zaman saygılı ve objektif ol
- Farklı mezhep ve yorumları dengeli sun
- Akademik kaynaklara atıfta bulun
- Ayetleri bağlamından koparmadan açıkla
- Kullanıcının dil tercihine göre cevap ver (Türkçe veya İngilizce)

## Mevcut Tool'lar:
- get_verse: Belirli bir ayeti getir
- search_quran: Anahtar kelime araması
- get_word_details: Kelime kelime analiz
- get_vocabulary: Öğrenme kelimeleri
- get_surah_list: Sure listesi

Kullanıcı bir ayet sorduğunda önce get_verse tool'unu kullan, sonra açıklama yap."""


class QuranAgent:
    """Kur'an öğrenme ve araştırma asistanı."""

    def __init__(self):
        self.options = ClaudeAgentOptions(
            allowed_tools=[
                "mcp__quran__get_verse",
                "mcp__quran__search_quran",
                "mcp__quran__get_word_details",
                "mcp__quran__get_vocabulary",
                "mcp__quran__get_surah_list",
            ],
            permission_mode="acceptEdits",
            system_prompt=SYSTEM_PROMPT,
            mcp_servers={"quran": quran_server}
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
                            response_text.append(f"\n[Tool kullanıldı: {block.name}]\n")

        return "\n".join(response_text)

    async def interactive(self):
        """İnteraktif sohbet modu."""
        print("=" * 60)
        print("Kur'an Asistanı - İnteraktif Mod")
        print("Çıkmak için 'quit' veya 'çık' yazın")
        print("=" * 60)

        async with ClaudeSDKClient(options=self.options) as client:
            while True:
                try:
                    user_input = input("\n📖 Soru: ").strip()

                    if user_input.lower() in ["quit", "exit", "çık", "q"]:
                        print("Hoşça kalın! 🌙")
                        break

                    if not user_input:
                        continue

                    print("\n🤖 Cevap:")
                    await client.query(user_input)

                    async for message in client.receive_response():
                        if isinstance(message, AssistantMessage):
                            for block in message.content:
                                if isinstance(block, TextBlock):
                                    print(block.text)
                                elif isinstance(block, ToolUseBlock):
                                    print(f"  [Tool: {block.name}]")

                except KeyboardInterrupt:
                    print("\n\nHoşça kalın! 🌙")
                    break
                except Exception as e:
                    print(f"Hata: {e}")


async def main():
    agent = QuranAgent()

    if len(sys.argv) > 1:
        if sys.argv[1] == "--interactive" or sys.argv[1] == "-i":
            await agent.interactive()
        else:
            question = " ".join(sys.argv[1:])
            response = await agent.ask(question)
            print(response)
    else:
        # Default: interactive mode
        await agent.interactive()


if __name__ == "__main__":
    asyncio.run(main())
