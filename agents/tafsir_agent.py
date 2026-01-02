#!/usr/bin/env python3
"""
Tafsir Agent - Kur'an tefsiri ve açıklama asistanı.

Özellikler:
- Ayet tefsiri ve açıklaması
- Farklı müfessirlerin görüşleri
- Nüzul sebepleri (esbab-ı nüzul)
- Tarihsel bağlam
- Dilbilimsel analiz

Kullanım:
    python tafsir_agent.py "Bakara 255 ayetinin tefsiri"
    python tafsir_agent.py --interactive
"""

import asyncio
import json
import sys
from pathlib import Path
from typing import Any, Optional

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
DATA_DIR = Path(__file__).parent.parent / "src" / "data"
QURAN_DIR = DATA_DIR / "quran"


def load_json(file_path: Path) -> Any:
    """JSON dosyası yükle."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


# ============= TAFSIR TOOLS =============

@tool(
    "get_verse_with_context",
    "Bir ayeti önceki ve sonraki ayetlerle birlikte getirir (bağlam için)",
    {"surah": int, "ayah": int, "context_size": int}
)
async def get_verse_with_context(args: dict[str, Any]) -> dict[str, Any]:
    """Ayet ve bağlamını getir."""
    surah = args["surah"]
    ayah = args["ayah"]
    context_size = args.get("context_size", 2)

    try:
        arabic = load_json(QURAN_DIR / "quran_arabic.json") or []
        turkish = load_json(QURAN_DIR / "quran_turkish.json") or []

        surah_data = next((s for s in arabic if s.get("id") == surah), None)
        if not surah_data:
            return {"content": [{"type": "text", "text": "Sure bulunamadı"}], "is_error": True}

        verses = surah_data.get("verses", [])
        tr_surah = next((s for s in turkish if s.get("id") == surah), {})
        tr_verses = tr_surah.get("verses", [])

        # Context range
        start_ayah = max(1, ayah - context_size)
        end_ayah = min(len(verses), ayah + context_size)

        context_verses = []
        for i in range(start_ayah, end_ayah + 1):
            verse = next((v for v in verses if v.get("id") == i), None)
            tr_verse = next((v for v in tr_verses if v.get("id") == i), None)

            if verse:
                context_verses.append({
                    "verse_key": f"{surah}:{i}",
                    "is_target": i == ayah,
                    "arabic": verse.get("text", ""),
                    "turkish": tr_verse.get("translation", "") if tr_verse else ""
                })

        return {
            "content": [{
                "type": "text",
                "text": json.dumps({
                    "target_verse": f"{surah}:{ayah}",
                    "context_verses": context_verses
                }, ensure_ascii=False, indent=2)
            }]
        }
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Hata: {e}"}], "is_error": True}


@tool(
    "get_study_quran_commentary",
    "Study Quran tefsirini getirir",
    {"surah": int, "ayah": int}
)
async def get_study_quran_commentary(args: dict[str, Any]) -> dict[str, Any]:
    """Study Quran tefsirini getir."""
    surah = args["surah"]
    ayah = args["ayah"]

    try:
        commentary = load_json(QURAN_DIR / "studyquran_commentary.json")

        if not commentary:
            return {"content": [{"type": "text", "text": "Tefsir verisi bulunamadı"}], "is_error": True}

        # Format: {"commentary": {"surah:ayah": "text"}}
        key = f"{surah}:{ayah}"
        comm_data = commentary.get("commentary", {})
        text = comm_data.get(key, "")

        if not text:
            return {"content": [{"type": "text", "text": f"Bu ayet için tefsir bulunamadı: {key}"}]}

        return {
            "content": [{
                "type": "text",
                "text": json.dumps({
                    "verse_key": key,
                    "source": "The Study Quran (Seyyed Hossein Nasr)",
                    "commentary": text
                }, ensure_ascii=False, indent=2)
            }]
        }
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Hata: {e}"}], "is_error": True}


@tool(
    "get_surah_info",
    "Sure hakkında genel bilgi getirir (iniş yeri, ayet sayısı, konusu)",
    {"surah": int}
)
async def get_surah_info(args: dict[str, Any]) -> dict[str, Any]:
    """Sure bilgisi getir."""
    surah = args["surah"]

    # Sure metadata
    SURAH_INFO = {
        1: {"name": "الفاتحة", "latin": "Al-Fatiha", "meaning": "Açılış", "revelation": "Mekke", "verses": 7, "theme": "Allah'a hamd, hidayet duası"},
        2: {"name": "البقرة", "latin": "Al-Baqarah", "meaning": "İnek", "revelation": "Medine", "verses": 286, "theme": "İman esasları, şeriat hükümleri, önceki ümmetlerin kıssaları"},
        3: {"name": "آل عمران", "latin": "Ali 'Imran", "meaning": "İmran Ailesi", "revelation": "Medine", "verses": 200, "theme": "Hristiyanlık, Uhud Savaşı, sabır"},
        36: {"name": "يس", "latin": "Ya-Sin", "meaning": "Ya Sin", "revelation": "Mekke", "verses": 83, "theme": "Peygamberlik, ahiret, Allah'ın kudreti"},
        55: {"name": "الرحمن", "latin": "Ar-Rahman", "meaning": "Rahman", "revelation": "Medine", "verses": 78, "theme": "Allah'ın nimetleri"},
        67: {"name": "الملك", "latin": "Al-Mulk", "meaning": "Mülk/Hükümranlık", "revelation": "Mekke", "verses": 30, "theme": "Allah'ın kudreti, kabir azabından korunma"},
        112: {"name": "الإخلاص", "latin": "Al-Ikhlas", "meaning": "İhlas/Samimiyet", "revelation": "Mekke", "verses": 4, "theme": "Tevhid"},
        113: {"name": "الفلق", "latin": "Al-Falaq", "meaning": "Sabah Aydınlığı", "revelation": "Mekke", "verses": 5, "theme": "Kötülüklerden sığınma"},
        114: {"name": "الناس", "latin": "An-Nas", "meaning": "İnsanlar", "revelation": "Mekke", "verses": 6, "theme": "Şeytandan sığınma"},
    }

    info = SURAH_INFO.get(surah)

    if info:
        return {
            "content": [{
                "type": "text",
                "text": json.dumps({
                    "surah_number": surah,
                    **info
                }, ensure_ascii=False, indent=2)
            }]
        }
    else:
        # Temel bilgi
        arabic = load_json(QURAN_DIR / "quran_arabic.json") or []
        surah_data = next((s for s in arabic if s.get("id") == surah), None)

        if surah_data:
            return {
                "content": [{
                    "type": "text",
                    "text": json.dumps({
                        "surah_number": surah,
                        "name": surah_data.get("name", ""),
                        "verses": len(surah_data.get("verses", []))
                    }, ensure_ascii=False, indent=2)
                }]
            }

        return {"content": [{"type": "text", "text": "Sure bulunamadı"}], "is_error": True}


@tool(
    "compare_translations",
    "Bir ayetin farklı çevirilerini karşılaştırır",
    {"surah": int, "ayah": int}
)
async def compare_translations(args: dict[str, Any]) -> dict[str, Any]:
    """Çevirileri karşılaştır."""
    surah = args["surah"]
    ayah = args["ayah"]

    try:
        translations = {}

        # Tüm çevirileri yükle
        files = {
            "Turkish (Diyanet)": "quran_turkish.json",
            "English (Sahih)": "quran_english.json",
            "English (Haleem)": "quran_haleem.json",
            "English (Clear Quran)": "quran_clearquran.json",
            "English (Study Quran)": "quran_studyquran.json",
        }

        for name, filename in files.items():
            data = load_json(QURAN_DIR / filename)
            if not data:
                continue

            # Array format
            if isinstance(data, list):
                surah_data = next((s for s in data if s.get("id") == surah), None)
                if surah_data:
                    verse = next((v for v in surah_data.get("verses", []) if v.get("id") == ayah), None)
                    if verse:
                        translations[name] = verse.get("translation", "")

            # Flat format
            elif isinstance(data, dict):
                text = data.get(str(surah), {}).get(str(ayah), "")
                if text:
                    translations[name] = text

        return {
            "content": [{
                "type": "text",
                "text": json.dumps({
                    "verse_key": f"{surah}:{ayah}",
                    "translations": translations
                }, ensure_ascii=False, indent=2)
            }]
        }
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Hata: {e}"}], "is_error": True}


@tool(
    "get_word_roots",
    "Bir ayetteki kelimelerin köklerini ve anlamlarını getirir",
    {"surah": int, "ayah": int}
)
async def get_word_roots(args: dict[str, Any]) -> dict[str, Any]:
    """Kelime köklerini getir."""
    surah = args["surah"]
    ayah = args["ayah"]

    try:
        surah_file = DATA_DIR / "quran-master" / f"surah-{str(surah).zfill(3)}.json"
        surah_data = load_json(surah_file)

        if not surah_data:
            return {"content": [{"type": "text", "text": "Kelime verisi bulunamadı"}], "is_error": True}

        verse_data = next((v for v in surah_data.get("verses", []) if v.get("verseNumber") == ayah), None)

        if not verse_data:
            return {"content": [{"type": "text", "text": "Ayet bulunamadı"}], "is_error": True}

        words = []
        for w in verse_data.get("words", []):
            words.append({
                "arabic": w.get("arabic", ""),
                "root_arabic": w.get("rootArabic", ""),
                "root_latin": w.get("root", ""),
                "translations": {
                    "tr": w.get("translations", {}).get("tr", ""),
                    "en": w.get("translations", {}).get("en", "")
                }
            })

        return {
            "content": [{
                "type": "text",
                "text": json.dumps({
                    "verse_key": f"{surah}:{ayah}",
                    "words": words
                }, ensure_ascii=False, indent=2)
            }]
        }
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Hata: {e}"}], "is_error": True}


# ============= AGENT SETUP =============

tafsir_server = create_sdk_mcp_server(
    name="tafsir",
    version="1.0.0",
    tools=[
        get_verse_with_context,
        get_study_quran_commentary,
        get_surah_info,
        compare_translations,
        get_word_roots
    ]
)

SYSTEM_PROMPT = """Sen Kur'an tefsiri konusunda uzmanlaşmış bir yapay zeka asistanısın.

## Uzmanlık Alanların:
1. **Klasik Tefsir:** İbn Kesir, Taberi, Kurtubi, Razi
2. **Modern Tefsir:** Elmalılı, Study Quran, Mevdudi
3. **Dilbilim:** Arapça kelime kökleri, belagat, i'rab
4. **Tarihsel Bağlam:** Nüzul sebepleri, sire

## Tefsir Metodolojin:
1. Önce ayetin Arapça metnini ve çevirilerini getir
2. Bağlam için önceki/sonraki ayetleri incele
3. Kelime köklerini ve literal anlamları açıkla
4. Nüzul sebebi varsa belirt
5. Farklı müfessirlerin yorumlarını karşılaştır
6. Modern hayata uygulamayı tartış

## Önemli Kurallar:
- Mezhep taassubu yapma, farklı görüşleri objektif sun
- Kaynak belirt (müfessir adı, eser adı)
- Tartışmalı konularda "Allah en iyi bilendir" de
- Akademik ve saygılı bir dil kullan
- Kendi görüşünü değil, alimlerin görüşlerini aktar

## Mevcut Tool'lar:
- get_verse_with_context: Ayet ve bağlamı
- get_study_quran_commentary: Study Quran tefsiri
- get_surah_info: Sure bilgisi
- compare_translations: Çeviri karşılaştırma
- get_word_roots: Kelime kökleri

Kullanıcı tefsir istediğinde, önce ilgili tool'ları kullanarak veri topla, sonra kapsamlı bir açıklama yap."""


class TafsirAgent:
    """Kur'an tefsiri asistanı."""

    def __init__(self):
        self.options = ClaudeAgentOptions(
            allowed_tools=[
                "mcp__tafsir__get_verse_with_context",
                "mcp__tafsir__get_study_quran_commentary",
                "mcp__tafsir__get_surah_info",
                "mcp__tafsir__compare_translations",
                "mcp__tafsir__get_word_roots",
            ],
            permission_mode="acceptEdits",
            system_prompt=SYSTEM_PROMPT,
            mcp_servers={"tafsir": tafsir_server}
        )

    async def explain(self, query: str) -> str:
        """Tefsir açıklaması yap."""
        response_text = []

        async with ClaudeSDKClient(options=self.options) as client:
            await client.query(query)

            async for message in client.receive_response():
                if isinstance(message, AssistantMessage):
                    for block in message.content:
                        if isinstance(block, TextBlock):
                            response_text.append(block.text)

        return "\n".join(response_text)

    async def interactive(self):
        """İnteraktif tefsir modu."""
        print("=" * 60)
        print("Tefsir Asistanı")
        print("Bir ayet numarası veya soru yazın (örn: 2:255)")
        print("Çıkmak için 'quit' yazın")
        print("=" * 60)

        async with ClaudeSDKClient(options=self.options) as client:
            while True:
                try:
                    user_input = input("\n📖 Tefsir: ").strip()

                    if user_input.lower() in ["quit", "exit", "çık", "q"]:
                        print("Allah'a emanet olun!")
                        break

                    if not user_input:
                        continue

                    print("\n🔍 Tefsir hazırlanıyor...\n")
                    await client.query(user_input)

                    async for message in client.receive_response():
                        if isinstance(message, AssistantMessage):
                            for block in message.content:
                                if isinstance(block, TextBlock):
                                    print(block.text)

                except KeyboardInterrupt:
                    print("\n\nAllah'a emanet olun!")
                    break


async def main():
    agent = TafsirAgent()

    if len(sys.argv) > 1:
        if sys.argv[1] in ["--interactive", "-i"]:
            await agent.interactive()
        else:
            query = " ".join(sys.argv[1:])
            response = await agent.explain(query)
            print(response)
    else:
        await agent.interactive()


if __name__ == "__main__":
    asyncio.run(main())
