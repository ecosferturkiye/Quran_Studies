#!/usr/bin/env python3
"""
Scraper Agent - Dış kaynaklardan veri çekme ve güncelleme asistanı.

Kullanım:
    python scraper_agent.py "Hayrat mealini güncelle"
    python scraper_agent.py --interactive
"""

import asyncio
import json
import os
import subprocess
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
SCRIPTS_DIR = PROJECT_DIR / "scripts"
DATA_DIR = PROJECT_DIR / "src" / "data" / "quran"


def run_command(cmd: list[str], cwd: Path = None) -> tuple[str, str, int]:
    """Komut çalıştır ve sonucu döndür."""
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd or PROJECT_DIR,
            capture_output=True,
            text=True,
            timeout=600  # 10 dakika timeout
        )
        return result.stdout, result.stderr, result.returncode
    except subprocess.TimeoutExpired:
        return "", "Timeout: İşlem 10 dakikayı aştı", 1
    except Exception as e:
        return "", str(e), 1


# ============= SCRAPER TOOLS =============

@tool(
    "scrape_hayrat",
    "Hayrat Neşriyat mealini kulliyat.risale.online'dan çeker",
    {"test_mode": bool}
)
async def scrape_hayrat(args: dict[str, Any]) -> dict[str, Any]:
    """Hayrat mealini çek."""
    test_mode = args.get("test_mode", False)

    script_path = SCRIPTS_DIR / "scrape_hayrat_v6.js"

    if not script_path.exists():
        return {
            "content": [{"type": "text", "text": f"Script bulunamadı: {script_path}"}],
            "is_error": True
        }

    cmd = ["node", str(script_path)]
    if test_mode:
        cmd.append("--test")

    stdout, stderr, returncode = run_command(cmd)

    if returncode != 0:
        return {
            "content": [{"type": "text", "text": f"Hata:\n{stderr}\n{stdout}"}],
            "is_error": True
        }

    return {
        "content": [{
            "type": "text",
            "text": f"Hayrat meal scraping başarılı:\n{stdout[-2000:]}"  # Son 2000 karakter
        }]
    }


@tool(
    "check_data_stats",
    "Mevcut veri dosyalarının istatistiklerini gösterir",
    {}
)
async def check_data_stats(args: dict[str, Any]) -> dict[str, Any]:
    """Veri istatistikleri."""
    stats = {}

    # Hayrat
    hayrat_path = DATA_DIR / "hayrat_meal.json"
    if hayrat_path.exists():
        with open(hayrat_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        stats["hayrat"] = {
            "translations": len(data.get("translations", {})),
            "tafsir": len(data.get("tafsir", {})),
            "version": data.get("metadata", {}).get("version", "unknown")
        }

    # Kur'an Yolu
    kuranyolu_path = DATA_DIR / "kuranyolu_commentary.json"
    if kuranyolu_path.exists():
        with open(kuranyolu_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        stats["kuranyolu"] = {"entries": len(data)}

    # Study Quran
    studyquran_path = DATA_DIR / "studyquran_commentary.json"
    if studyquran_path.exists():
        with open(studyquran_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        stats["studyquran"] = {"entries": len(data)}

    # Çeviriler
    translations = [
        "quran_turkish.json", "quran_elmalili.json", "quran_english.json",
        "quran_haleem.json", "quran_clearquran.json", "quran_studyquran.json"
    ]

    for t in translations:
        path = DATA_DIR / t
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, list):
                count = sum(len(s.get("verses", [])) for s in data)
            elif isinstance(data, dict):
                count = sum(len(v) for v in data.values()) if data else 0
            else:
                count = 0
            stats[t.replace(".json", "")] = {"verses": count}

    return {
        "content": [{
            "type": "text",
            "text": json.dumps(stats, ensure_ascii=False, indent=2)
        }]
    }


@tool(
    "validate_data",
    "Veri dosyalarını kontrol eder ve sorunları raporlar",
    {"source": str}
)
async def validate_data(args: dict[str, Any]) -> dict[str, Any]:
    """Veri doğrulama."""
    source = args["source"]  # hayrat, kuranyolu, studyquran, all

    issues = []

    def check_html_remnants(text: str, key: str) -> list[str]:
        """HTML artıklarını kontrol et."""
        problems = []
        if "</span" in text:
            problems.append(f"{key}: HTML </span tag bulundu")
        if "<span" in text:
            problems.append(f"{key}: HTML <span tag bulundu")
        if "&nbsp;" in text:
            problems.append(f"{key}: &nbsp; entity bulundu")
        return problems

    if source in ["hayrat", "all"]:
        hayrat_path = DATA_DIR / "hayrat_meal.json"
        if hayrat_path.exists():
            with open(hayrat_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            for key, text in data.get("translations", {}).items():
                issues.extend(check_html_remnants(text, f"hayrat.translation.{key}"))

            for key, text in data.get("tafsir", {}).items():
                issues.extend(check_html_remnants(text, f"hayrat.tafsir.{key}"))

    if source in ["kuranyolu", "all"]:
        kuranyolu_path = DATA_DIR / "kuranyolu_commentary.json"
        if kuranyolu_path.exists():
            with open(kuranyolu_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            for key, text in data.items():
                issues.extend(check_html_remnants(text, f"kuranyolu.{key}"))

    if source in ["studyquran", "all"]:
        studyquran_path = DATA_DIR / "studyquran_commentary.json"
        if studyquran_path.exists():
            with open(studyquran_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            for key, text in data.items():
                issues.extend(check_html_remnants(text, f"studyquran.{key}"))

    result = {
        "source": source,
        "issues_found": len(issues),
        "issues": issues[:50]  # İlk 50 sorun
    }

    return {
        "content": [{
            "type": "text",
            "text": json.dumps(result, ensure_ascii=False, indent=2)
        }]
    }


@tool(
    "list_scrapers",
    "Mevcut scraper script'lerini listeler",
    {}
)
async def list_scrapers(args: dict[str, Any]) -> dict[str, Any]:
    """Scraper'ları listele."""
    scrapers = []

    for f in SCRIPTS_DIR.glob("*.js"):
        scrapers.append({
            "file": f.name,
            "type": "JavaScript (Node.js)",
            "path": str(f)
        })

    for f in SCRIPTS_DIR.glob("*.py"):
        scrapers.append({
            "file": f.name,
            "type": "Python",
            "path": str(f)
        })

    return {
        "content": [{
            "type": "text",
            "text": json.dumps({
                "count": len(scrapers),
                "scrapers": scrapers
            }, ensure_ascii=False, indent=2)
        }]
    }


# ============= AGENT SETUP =============

scraper_server = create_sdk_mcp_server(
    name="scraper",
    version="1.0.0",
    tools=[scrape_hayrat, check_data_stats, validate_data, list_scrapers]
)

SYSTEM_PROMPT = """Sen veri çekme ve güncelleme konusunda uzmanlaşmış bir yapay zeka asistanısın.

## Görevlerin:
1. Web scraping işlemlerini yönetmek
2. Veri kalitesini kontrol etmek
3. Veri dönüşümlerini gerçekleştirmek
4. Scraper script'lerini çalıştırmak
5. Hataları tespit ve raporlamak

## Veri Kaynakları:
- **Hayrat Neşriyat**: kulliyat.risale.online (Türkçe meal + Risale-i Nur tefsiri)
- **Kur'an Yolu**: kuran.diyanet.gov.tr (Diyanet tefsiri)
- **Study Quran**: PDF OCR (İngilizce akademik tefsir)

## Kuralların:
- Scraping öncesi mevcut veriyi yedekle
- Rate limiting'e dikkat et (100-200ms)
- Hataları logla ve raporla
- Veri temizliği yap (HTML entities, tags)
- UTF-8 encoding koru

## Mevcut Tool'lar:
- scrape_hayrat: Hayrat mealini çek
- check_data_stats: Veri istatistikleri
- validate_data: Veri doğrulama
- list_scrapers: Scraper listesi"""


class ScraperAgent:
    """Veri çekme ve güncelleme asistanı."""

    def __init__(self):
        self.options = ClaudeAgentOptions(
            allowed_tools=[
                "mcp__scraper__scrape_hayrat",
                "mcp__scraper__check_data_stats",
                "mcp__scraper__validate_data",
                "mcp__scraper__list_scrapers",
            ],
            permission_mode="acceptEdits",
            system_prompt=SYSTEM_PROMPT,
            mcp_servers={"scraper": scraper_server}
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
        print("Scraper Agent - Veri Çekme Asistanı")
        print("Çıkmak için 'quit' yazın")
        print("=" * 60)

        async with ClaudeSDKClient(options=self.options) as client:
            while True:
                try:
                    user_input = input("\n🔧 Komut: ").strip()

                    if user_input.lower() in ["quit", "exit", "q"]:
                        print("Çıkış yapılıyor...")
                        break

                    if not user_input:
                        continue

                    print("\n📊 Sonuç:")
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
    agent = ScraperAgent()

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
