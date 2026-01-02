#!/usr/bin/env python3
"""
Learning Agent - Kur'an kelime öğrenme asistanı.

Özellikler:
- Flashcard çalışması
- Spaced repetition önerileri
- İlerleme takibi
- Kelime kökleri açıklaması

Kullanım:
    python learning_agent.py "bugün hangi kelimeleri çalışmalıyım?"
    python learning_agent.py --quiz
    python learning_agent.py --interactive
"""

import asyncio
import json
import os
import sys
import random
from datetime import datetime
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
LEARNING_DIR = DATA_DIR / "learning"
PROGRESS_FILE = Path(__file__).parent / "learning_progress.json"


def load_json(file_path: Path) -> Any:
    """JSON dosyası yükle."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def save_json(file_path: Path, data: Any):
    """JSON dosyası kaydet."""
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def load_progress() -> dict:
    """Öğrenme ilerlemesini yükle."""
    if PROGRESS_FILE.exists():
        return load_json(PROGRESS_FILE) or {}
    return {"cards": {}, "streak": 0, "last_study": None, "total_reviews": 0}


def save_progress(progress: dict):
    """İlerlemeyi kaydet."""
    save_json(PROGRESS_FILE, progress)


# ============= LEARNING TOOLS =============

@tool(
    "get_flashcards",
    "Bugün çalışılacak flashcard'ları getirir",
    {"category": str, "count": int}
)
async def get_flashcards(args: dict[str, Any]) -> dict[str, Any]:
    """Flashcard getir."""
    category = args.get("category", "words")
    count = args.get("count", 10)

    try:
        if category == "words":
            data = load_json(LEARNING_DIR / "words_300.json")
        elif category == "twogram":
            data = load_json(LEARNING_DIR / "twogram.json")
        elif category == "threegram":
            data = load_json(LEARNING_DIR / "threegram.json")
        else:
            return {
                "content": [{"type": "text", "text": "Geçersiz kategori"}],
                "is_error": True
            }

        if not data:
            return {
                "content": [{"type": "text", "text": "Veri bulunamadı"}],
                "is_error": True
            }

        # Get items
        items = list(data.values()) if isinstance(data, dict) else data

        # Shuffle and select
        random.shuffle(items)
        selected = items[:count]

        # Format as flashcards
        flashcards = []
        for item in selected:
            flashcards.append({
                "id": item.get("id", ""),
                "arabic": item.get("arabic", ""),
                "translations": item.get("translations", {}),
                "frequency": item.get("frequency", 0),
            })

        return {
            "content": [{
                "type": "text",
                "text": json.dumps({
                    "category": category,
                    "count": len(flashcards),
                    "flashcards": flashcards
                }, ensure_ascii=False, indent=2)
            }]
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Hata: {e}"}],
            "is_error": True
        }


@tool(
    "get_learning_stats",
    "Öğrenme istatistiklerini getirir",
    {}
)
async def get_learning_stats(args: dict[str, Any]) -> dict[str, Any]:
    """İstatistik getir."""
    try:
        progress = load_progress()

        cards = progress.get("cards", {})
        mastered = sum(1 for c in cards.values() if c.get("mastery", "") == "mastered")
        learning = sum(1 for c in cards.values() if c.get("mastery", "") == "learning")
        reviewing = sum(1 for c in cards.values() if c.get("mastery", "") == "reviewing")

        stats = {
            "total_cards": len(cards),
            "mastered": mastered,
            "learning": learning,
            "reviewing": reviewing,
            "new": len(cards) - mastered - learning - reviewing,
            "streak": progress.get("streak", 0),
            "total_reviews": progress.get("total_reviews", 0),
            "last_study": progress.get("last_study"),
        }

        return {
            "content": [{
                "type": "text",
                "text": json.dumps(stats, ensure_ascii=False, indent=2)
            }]
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Hata: {e}"}],
            "is_error": True
        }


@tool(
    "record_review",
    "Bir kartın çalışma sonucunu kaydeder",
    {"card_id": str, "rating": str}
)
async def record_review(args: dict[str, Any]) -> dict[str, Any]:
    """Çalışma sonucu kaydet."""
    card_id = args["card_id"]
    rating = args["rating"]  # again, hard, good, easy

    try:
        progress = load_progress()
        cards = progress.setdefault("cards", {})

        # Get or create card progress
        card = cards.setdefault(card_id, {
            "repetitions": 0,
            "ease_factor": 2.5,
            "interval": 1,
            "mastery": "new"
        })

        # SM-2 algorithm
        quality = {"again": 0, "hard": 1, "good": 4, "easy": 5}.get(rating, 3)

        if quality < 3:
            card["repetitions"] = 0
            card["interval"] = 1
        else:
            if card["repetitions"] == 0:
                card["interval"] = 1
            elif card["repetitions"] == 1:
                card["interval"] = 6
            else:
                card["interval"] = int(card["interval"] * card["ease_factor"])

            card["repetitions"] += 1

        # Update ease factor
        card["ease_factor"] = max(1.3, card["ease_factor"] + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))

        # Update mastery
        if card["repetitions"] == 0:
            card["mastery"] = "new"
        elif card["repetitions"] < 3:
            card["mastery"] = "learning"
        elif card["interval"] < 21:
            card["mastery"] = "reviewing"
        else:
            card["mastery"] = "mastered"

        card["last_review"] = datetime.now().isoformat()

        # Update global stats
        progress["total_reviews"] = progress.get("total_reviews", 0) + 1
        progress["last_study"] = datetime.now().isoformat()[:10]

        save_progress(progress)

        return {
            "content": [{
                "type": "text",
                "text": json.dumps({
                    "card_id": card_id,
                    "new_interval": card["interval"],
                    "mastery": card["mastery"],
                    "message": f"Kart kaydedildi. Sonraki tekrar: {card['interval']} gün sonra"
                }, ensure_ascii=False, indent=2)
            }]
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Hata: {e}"}],
            "is_error": True
        }


@tool(
    "explain_root",
    "Arapça bir kelimenin kökünü ve türevlerini açıklar",
    {"word": str}
)
async def explain_root(args: dict[str, Any]) -> dict[str, Any]:
    """Kelime kökü açıkla."""
    word = args["word"]

    # Bu tool aslında Claude'un bilgisini kullanacak
    # Burada sadece formatlama yapıyoruz
    return {
        "content": [{
            "type": "text",
            "text": f"'{word}' kelimesinin kök analizi istendi. Bu kelimeyi Arapça dilbilgisi açısından açıkla."
        }]
    }


@tool(
    "get_due_cards",
    "Bugün tekrar edilmesi gereken kartları getirir",
    {"limit": int}
)
async def get_due_cards(args: dict[str, Any]) -> dict[str, Any]:
    """Due kartları getir."""
    limit = args.get("limit", 20)

    try:
        progress = load_progress()
        cards = progress.get("cards", {})

        today = datetime.now().isoformat()[:10]
        due_cards = []

        for card_id, card_data in cards.items():
            last_review = card_data.get("last_review", "")
            if last_review:
                last_date = datetime.fromisoformat(last_review[:10])
                interval = card_data.get("interval", 1)
                next_date = last_date.replace(day=last_date.day + interval)

                if next_date.isoformat()[:10] <= today:
                    due_cards.append({
                        "id": card_id,
                        "mastery": card_data.get("mastery"),
                        "days_overdue": (datetime.now() - next_date).days
                    })

        # Sort by overdue days
        due_cards.sort(key=lambda x: x.get("days_overdue", 0), reverse=True)
        due_cards = due_cards[:limit]

        return {
            "content": [{
                "type": "text",
                "text": json.dumps({
                    "due_count": len(due_cards),
                    "cards": due_cards
                }, ensure_ascii=False, indent=2)
            }]
        }
    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Hata: {e}"}],
            "is_error": True
        }


# ============= AGENT SETUP =============

learning_server = create_sdk_mcp_server(
    name="learning",
    version="1.0.0",
    tools=[get_flashcards, get_learning_stats, record_review, explain_root, get_due_cards]
)

SYSTEM_PROMPT = """Sen Kur'an Arapçası öğrenme asistanısın.

## Görevlerin:
1. Flashcard çalışması yönetmek
2. Kelime köklerini ve kalıplarını açıklamak
3. Spaced repetition ile etkili öğrenme sağlamak
4. İlerleme takibi ve motivasyon
5. Öğrenme stratejileri önermek

## Çalışma Metodolojisi:
- SM-2 spaced repetition algoritması kullan
- Kelime kökleri üzerinden gruplayarak öğret
- Kur'an'daki kullanım bağlamlarını göster
- Türevleri ve benzer kalıpları öğret

## Mevcut Tool'lar:
- get_flashcards: Çalışılacak kartları getir
- get_learning_stats: İstatistikleri göster
- record_review: Çalışma sonucu kaydet
- explain_root: Kelime kökü açıkla
- get_due_cards: Bugün tekrar edilecek kartlar

## Önemli:
- Cesaretlendirici ve sabırlı ol
- Hataları öğrenme fırsatı olarak sun
- Günlük çalışmayı teşvik et
- İlerlemeyi kutla"""


class LearningAgent:
    """Kur'an kelime öğrenme asistanı."""

    def __init__(self):
        self.options = ClaudeAgentOptions(
            allowed_tools=[
                "mcp__learning__get_flashcards",
                "mcp__learning__get_learning_stats",
                "mcp__learning__record_review",
                "mcp__learning__explain_root",
                "mcp__learning__get_due_cards",
            ],
            permission_mode="acceptEdits",
            system_prompt=SYSTEM_PROMPT,
            mcp_servers={"learning": learning_server}
        )

    async def quiz_mode(self, count: int = 10):
        """Quiz modu - interaktif flashcard çalışması."""
        print("=" * 60)
        print("🎓 Kur'an Kelime Quiz")
        print("=" * 60)

        # Load words
        words_data = load_json(LEARNING_DIR / "words_300.json")
        if not words_data:
            print("Kelime verisi bulunamadı!")
            return

        items = list(words_data.values()) if isinstance(words_data, dict) else words_data
        random.shuffle(items)
        selected = items[:count]

        correct = 0
        for i, word in enumerate(selected, 1):
            print(f"\n--- Soru {i}/{count} ---")
            print(f"\n📝 Arapça: {word.get('arabic', '')}")

            input("\n[Enter'a basarak cevabı gör...]")

            translations = word.get("translations", {})
            print(f"\n✅ Türkçe: {translations.get('tr', '-')}")
            print(f"✅ İngilizce: {translations.get('en', '-')}")

            rating = input("\nBildin mi? (e/h): ").strip().lower()
            if rating in ["e", "y", "evet", "yes"]:
                correct += 1
                print("👍 Harika!")
            else:
                print("💪 Bir dahaki sefere!")

        print(f"\n{'=' * 60}")
        print(f"📊 Sonuç: {correct}/{count} ({100 * correct // count}%)")
        print("=" * 60)

    async def interactive(self):
        """İnteraktif öğrenme modu."""
        print("=" * 60)
        print("🎓 Kur'an Öğrenme Asistanı")
        print("Çıkmak için 'quit' yazın")
        print("=" * 60)

        async with ClaudeSDKClient(options=self.options) as client:
            while True:
                try:
                    user_input = input("\n📚 > ").strip()

                    if user_input.lower() in ["quit", "exit", "çık", "q"]:
                        print("Çalışmaya devam! 🌟")
                        break

                    if not user_input:
                        continue

                    print("\n🤖 ")
                    await client.query(user_input)

                    async for message in client.receive_response():
                        if isinstance(message, AssistantMessage):
                            for block in message.content:
                                if isinstance(block, TextBlock):
                                    print(block.text)

                except KeyboardInterrupt:
                    print("\n\nÇalışmaya devam! 🌟")
                    break


async def main():
    agent = LearningAgent()

    if len(sys.argv) > 1:
        if sys.argv[1] in ["--quiz", "-q"]:
            count = int(sys.argv[2]) if len(sys.argv) > 2 else 10
            await agent.quiz_mode(count)
        elif sys.argv[1] in ["--interactive", "-i"]:
            await agent.interactive()
        else:
            # Single question
            question = " ".join(sys.argv[1:])
            async with ClaudeSDKClient(options=agent.options) as client:
                await client.query(question)
                async for message in client.receive_response():
                    if isinstance(message, AssistantMessage):
                        for block in message.content:
                            if isinstance(block, TextBlock):
                                print(block.text)
    else:
        await agent.interactive()


if __name__ == "__main__":
    asyncio.run(main())
