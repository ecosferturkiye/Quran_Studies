#!/usr/bin/env python3
"""
Research Agent - Kur'an araştırma asistanı.

Özellikler:
- Tematik arama ve analiz
- İstatistikler (kelime frekansı, sure uzunlukları)
- Çapraz referanslar
- Konu bazlı ayetler
- Karşılaştırmalı analiz

Kullanım:
    python research_agent.py "Kur'an'da sabır konusu"
    python research_agent.py "En uzun 5 sure"
    python research_agent.py --interactive
"""

import asyncio
import json
import sys
import re
from pathlib import Path
from typing import Any, List, Dict
from collections import Counter

from claude_agent_sdk import (
    ClaudeSDKClient,
    ClaudeAgentOptions,
    tool,
    create_sdk_mcp_server,
    AssistantMessage,
    TextBlock,
)

# Paths
DATA_DIR = Path(__file__).parent.parent / "src" / "data"
QURAN_DIR = DATA_DIR / "quran"
LEARNING_DIR = DATA_DIR / "learning"


def load_json(file_path: Path) -> Any:
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


# Sure bilgileri
SURAH_METADATA = {
    1: {"name": "الفاتحة", "latin": "Al-Fatiha", "revelation": "meccan", "verses": 7},
    2: {"name": "البقرة", "latin": "Al-Baqarah", "revelation": "medinan", "verses": 286},
    3: {"name": "آل عمران", "latin": "Ali 'Imran", "revelation": "medinan", "verses": 200},
    # ... (kısaltılmış)
}

# Tematik anahtar kelimeler
THEMES = {
    "sabır": ["صبر", "اصبر", "صابر", "patience", "patient", "sabr", "sabır", "sabredin"],
    "namaz": ["صلاة", "صلوة", "prayer", "salat", "namaz", "kılın"],
    "zekat": ["زكاة", "زكوة", "zakat", "zekat", "charity", "sadaka"],
    "iman": ["إيمان", "آمن", "مؤمن", "faith", "believe", "iman", "inanmak"],
    "takva": ["تقوى", "اتقوا", "متقين", "piety", "taqwa", "takva", "sakının"],
    "cennet": ["جنة", "جنات", "paradise", "garden", "cennet"],
    "cehennem": ["نار", "جهنم", "hell", "fire", "cehennem", "ateş"],
    "rahmet": ["رحمة", "رحمن", "رحيم", "mercy", "merciful", "rahmet"],
    "adalet": ["عدل", "قسط", "justice", "fair", "adalet"],
    "ilim": ["علم", "عليم", "knowledge", "know", "ilim", "bilgi"],
}


# ============= RESEARCH TOOLS =============

@tool(
    "search_by_theme",
    "Belirli bir tema/konu ile ilgili ayetleri arar",
    {"theme": str, "limit": int}
)
async def search_by_theme(args: dict[str, Any]) -> dict[str, Any]:
    """Tematik arama yap."""
    theme = args["theme"].lower()
    limit = args.get("limit", 20)

    # Tema anahtar kelimelerini bul
    keywords = THEMES.get(theme, [theme])

    results = []

    # Tüm çevirilerde ara
    arabic = load_json(QURAN_DIR / "quran_arabic.json") or []
    turkish = load_json(QURAN_DIR / "quran_turkish.json") or []
    english = load_json(QURAN_DIR / "quran_english.json") or []

    for surah in arabic:
        surah_id = surah.get("id")
        tr_surah = next((s for s in turkish if s.get("id") == surah_id), {})
        en_surah = next((s for s in english if s.get("id") == surah_id), {})

        for verse in surah.get("verses", []):
            ayah_id = verse.get("id")
            tr_verse = next((v for v in tr_surah.get("verses", []) if v.get("id") == ayah_id), {})
            en_verse = next((v for v in en_surah.get("verses", []) if v.get("id") == ayah_id), {})

            # Tüm metinleri birleştir
            all_text = " ".join([
                verse.get("text", ""),
                tr_verse.get("translation", ""),
                en_verse.get("translation", "")
            ]).lower()

            # Anahtar kelime kontrolü
            for keyword in keywords:
                if keyword.lower() in all_text:
                    results.append({
                        "verse_key": f"{surah_id}:{ayah_id}",
                        "arabic": verse.get("text", "")[:100],
                        "turkish": tr_verse.get("translation", "")[:150],
                        "matched_keyword": keyword
                    })
                    break

            if len(results) >= limit:
                break
        if len(results) >= limit:
            break

    return {
        "content": [{
            "type": "text",
            "text": json.dumps({
                "theme": theme,
                "keywords_used": keywords,
                "count": len(results),
                "results": results
            }, ensure_ascii=False, indent=2)
        }]
    }


@tool(
    "get_quran_statistics",
    "Kur'an istatistiklerini getirir",
    {"stat_type": str}
)
async def get_quran_statistics(args: dict[str, Any]) -> dict[str, Any]:
    """İstatistik getir."""
    stat_type = args["stat_type"].lower()

    arabic = load_json(QURAN_DIR / "quran_arabic.json") or []

    if stat_type in ["surah", "sure", "sureler"]:
        # Sure istatistikleri
        surah_stats = []
        for surah in arabic:
            verses = surah.get("verses", [])
            total_words = sum(len(v.get("text", "").split()) for v in verses)
            surah_stats.append({
                "number": surah.get("id"),
                "name": surah.get("name"),
                "verse_count": len(verses),
                "word_count": total_words
            })

        # En uzun ve en kısa
        by_verses = sorted(surah_stats, key=lambda x: x["verse_count"], reverse=True)
        by_words = sorted(surah_stats, key=lambda x: x["word_count"], reverse=True)

        return {
            "content": [{
                "type": "text",
                "text": json.dumps({
                    "total_surahs": len(surah_stats),
                    "total_verses": sum(s["verse_count"] for s in surah_stats),
                    "longest_by_verses": by_verses[:5],
                    "shortest_by_verses": by_verses[-5:],
                    "longest_by_words": by_words[:5]
                }, ensure_ascii=False, indent=2)
            }]
        }

    elif stat_type in ["word", "kelime"]:
        # Kelime frekansı
        words_data = load_json(LEARNING_DIR / "words_300.json")
        if words_data:
            items = list(words_data.values()) if isinstance(words_data, dict) else words_data
            top_words = sorted(items, key=lambda x: x.get("frequency", 0), reverse=True)[:20]

            return {
                "content": [{
                    "type": "text",
                    "text": json.dumps({
                        "description": "En sık kullanılan 20 kelime",
                        "words": [{
                            "arabic": w.get("arabic"),
                            "frequency": w.get("frequency"),
                            "meaning_tr": w.get("translations", {}).get("tr"),
                            "meaning_en": w.get("translations", {}).get("en")
                        } for w in top_words]
                    }, ensure_ascii=False, indent=2)
                }]
            }

    elif stat_type in ["revelation", "inis", "vahiy"]:
        # İniş yeri istatistikleri
        meccan = sum(1 for s in SURAH_METADATA.values() if s.get("revelation") == "meccan")
        medinan = 114 - meccan

        return {
            "content": [{
                "type": "text",
                "text": json.dumps({
                    "meccan_surahs": meccan,
                    "medinan_surahs": medinan,
                    "note": "Mekki sureler genellikle akide (inanç), Medeni sureler ise ahkam (hükümler) içerir"
                }, ensure_ascii=False, indent=2)
            }]
        }

    return {
        "content": [{
            "type": "text",
            "text": "Geçersiz istatistik tipi. Seçenekler: surah, word, revelation"
        }],
        "is_error": True
    }


@tool(
    "find_similar_verses",
    "Benzer ayetleri bulur (aynı kelime kökü veya tema)",
    {"surah": int, "ayah": int}
)
async def find_similar_verses(args: dict[str, Any]) -> dict[str, Any]:
    """Benzer ayetleri bul."""
    surah = args["surah"]
    ayah = args["ayah"]

    # Hedef ayeti al
    arabic = load_json(QURAN_DIR / "quran_arabic.json") or []
    surah_data = next((s for s in arabic if s.get("id") == surah), None)

    if not surah_data:
        return {"content": [{"type": "text", "text": "Sure bulunamadı"}], "is_error": True}

    target_verse = next((v for v in surah_data.get("verses", []) if v.get("id") == ayah), None)

    if not target_verse:
        return {"content": [{"type": "text", "text": "Ayet bulunamadı"}], "is_error": True}

    target_text = target_verse.get("text", "")
    target_words = set(target_text.split())

    # Benzer ayetleri bul (ortak kelime sayısına göre)
    similar = []

    for s in arabic:
        for v in s.get("verses", []):
            if s.get("id") == surah and v.get("id") == ayah:
                continue

            verse_words = set(v.get("text", "").split())
            common = target_words & verse_words

            if len(common) >= 3:  # En az 3 ortak kelime
                similar.append({
                    "verse_key": f"{s.get('id')}:{v.get('id')}",
                    "common_words": len(common),
                    "text_preview": v.get("text", "")[:100]
                })

    # En çok ortak kelimesi olanları sırala
    similar.sort(key=lambda x: x["common_words"], reverse=True)

    return {
        "content": [{
            "type": "text",
            "text": json.dumps({
                "target_verse": f"{surah}:{ayah}",
                "similar_verses": similar[:10]
            }, ensure_ascii=False, indent=2)
        }]
    }


@tool(
    "get_available_themes",
    "Araştırma için mevcut temaları listeler",
    {}
)
async def get_available_themes(args: dict[str, Any]) -> dict[str, Any]:
    """Mevcut temaları listele."""
    themes_list = []
    for theme, keywords in THEMES.items():
        themes_list.append({
            "theme": theme,
            "keywords": keywords[:3],
            "keyword_count": len(keywords)
        })

    return {
        "content": [{
            "type": "text",
            "text": json.dumps({
                "available_themes": themes_list,
                "note": "Herhangi bir kelime ile de arama yapabilirsiniz"
            }, ensure_ascii=False, indent=2)
        }]
    }


@tool(
    "compare_surahs",
    "İki sureyi karşılaştırır",
    {"surah1": int, "surah2": int}
)
async def compare_surahs(args: dict[str, Any]) -> dict[str, Any]:
    """Sureleri karşılaştır."""
    surah1 = args["surah1"]
    surah2 = args["surah2"]

    arabic = load_json(QURAN_DIR / "quran_arabic.json") or []

    s1_data = next((s for s in arabic if s.get("id") == surah1), None)
    s2_data = next((s for s in arabic if s.get("id") == surah2), None)

    if not s1_data or not s2_data:
        return {"content": [{"type": "text", "text": "Sure bulunamadı"}], "is_error": True}

    def analyze_surah(data):
        verses = data.get("verses", [])
        all_words = []
        for v in verses:
            all_words.extend(v.get("text", "").split())

        return {
            "name": data.get("name"),
            "verse_count": len(verses),
            "word_count": len(all_words),
            "unique_words": len(set(all_words)),
            "avg_words_per_verse": round(len(all_words) / len(verses), 1) if verses else 0
        }

    comparison = {
        "surah_1": {"number": surah1, **analyze_surah(s1_data)},
        "surah_2": {"number": surah2, **analyze_surah(s2_data)},
    }

    # Ortak kelimeler
    words1 = set()
    words2 = set()
    for v in s1_data.get("verses", []):
        words1.update(v.get("text", "").split())
    for v in s2_data.get("verses", []):
        words2.update(v.get("text", "").split())

    comparison["common_unique_words"] = len(words1 & words2)

    return {
        "content": [{
            "type": "text",
            "text": json.dumps(comparison, ensure_ascii=False, indent=2)
        }]
    }


# ============= AGENT SETUP =============

research_server = create_sdk_mcp_server(
    name="research",
    version="1.0.0",
    tools=[
        search_by_theme,
        get_quran_statistics,
        find_similar_verses,
        get_available_themes,
        compare_surahs
    ]
)

SYSTEM_PROMPT = """Sen Kur'an araştırmaları konusunda uzmanlaşmış bir asistansın.

## Uzmanlık Alanların:
1. **Tematik Analiz:** Konulara göre ayet gruplandırma
2. **İstatistiksel Analiz:** Kelime frekansı, sure uzunlukları
3. **Karşılaştırmalı Çalışma:** Sureler ve ayetler arası bağlantılar
4. **Metin Analizi:** Kelime kökleri, tekrarlar

## Araştırma Metodolojin:
1. Kullanıcının sorusunu analiz et
2. Uygun tool'ları kullan
3. Verileri yorumla ve bağlam sağla
4. Akademik ve objektif ol
5. Kaynakları belirt

## Mevcut Tool'lar:
- search_by_theme: Tematik arama
- get_quran_statistics: İstatistikler
- find_similar_verses: Benzer ayetler
- get_available_themes: Mevcut temalar
- compare_surahs: Sure karşılaştırma

## Önemli:
- Verileri doğru yorumla
- Spekülatif iddialarda bulunma
- "Allahu a'lem" (Allah en iyi bilendir) prensibini hatırla
- Farklı akademik görüşleri sun"""


class ResearchAgent:
    """Kur'an araştırma asistanı."""

    def __init__(self):
        self.options = ClaudeAgentOptions(
            allowed_tools=[
                "mcp__research__search_by_theme",
                "mcp__research__get_quran_statistics",
                "mcp__research__find_similar_verses",
                "mcp__research__get_available_themes",
                "mcp__research__compare_surahs",
            ],
            permission_mode="acceptEdits",
            system_prompt=SYSTEM_PROMPT,
            mcp_servers={"research": research_server}
        )

    async def interactive(self):
        """İnteraktif mod."""
        print("=" * 60)
        print("Kur'an Araştırma Asistanı")
        print("Sorularınızı yazın")
        print("Çıkmak için 'quit' yazın")
        print("=" * 60)

        async with ClaudeSDKClient(options=self.options) as client:
            while True:
                try:
                    user_input = input("\n🔍 Araştırma: ").strip()

                    if user_input.lower() in ["quit", "exit", "çık", "q"]:
                        print("Allah'a emanet!")
                        break

                    if not user_input:
                        continue

                    await client.query(user_input)

                    async for message in client.receive_response():
                        if isinstance(message, AssistantMessage):
                            for block in message.content:
                                if isinstance(block, TextBlock):
                                    print(block.text)

                except KeyboardInterrupt:
                    print("\n\nAllah'a emanet!")
                    break


async def main():
    agent = ResearchAgent()

    if len(sys.argv) > 1:
        if sys.argv[1] in ["--interactive", "-i"]:
            await agent.interactive()
        else:
            query = " ".join(sys.argv[1:])
            async with ClaudeSDKClient(options=agent.options) as client:
                await client.query(query)
                async for message in client.receive_response():
                    if isinstance(message, AssistantMessage):
                        for block in message.content:
                            if isinstance(block, TextBlock):
                                print(block.text)
    else:
        await agent.interactive()


if __name__ == "__main__":
    asyncio.run(main())
