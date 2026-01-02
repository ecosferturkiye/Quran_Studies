#!/usr/bin/env python3
"""
Audio Agent - Kur'an tilaveti ve tecvid asistanı.

Özellikler:
- Kari bilgileri ve karşılaştırma
- Audio URL yönetimi
- Tecvid kuralları açıklaması
- Telaffuz rehberliği
- Kelime zamanlamaları

Kullanım:
    python audio_agent.py "Fatiha suresi için en iyi kari kim?"
    python audio_agent.py "Tecvid kurallarını açıkla"
    python audio_agent.py --interactive
"""

import asyncio
import json
import sys
from pathlib import Path
from typing import Any

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


def load_json(file_path: Path) -> Any:
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


# Kari bilgileri
RECITERS = {
    "mishari": {
        "id": 7,
        "name": "Mishari Rashid al-Afasy",
        "name_arabic": "مشاري راشد العفاسي",
        "country": "Kuveyt",
        "style": "Murattal",
        "description": "Modern dönemin en popüler karilerinden. Net ve anlaşılır tilaveti ile bilinen, özellikle gençler arasında sevilen bir kari.",
        "specialty": "Murattal, Tilawat",
        "audio_quality": "Yüksek",
        "recommended_for": "Günlük okuma, ezberleme"
    },
    "abdulbasit_mujawwad": {
        "id": 1,
        "name": "AbdulBaset AbdulSamad (Mujawwad)",
        "name_arabic": "عبد الباسط عبد الصمد",
        "country": "Mısır",
        "style": "Mujawwad",
        "description": "20. yüzyılın en büyük karilerinden. Mujawwad (süslü) tarzı ile ünlü. Duygusal ve etkileyici tilaveti ile tanınır.",
        "specialty": "Mujawwad, makam geçişleri",
        "audio_quality": "Klasik kayıt",
        "recommended_for": "Dinleme, tefekkür"
    },
    "abdulbasit_murattal": {
        "id": 2,
        "name": "AbdulBaset AbdulSamad (Murattal)",
        "name_arabic": "عبد الباسط عبد الصمد",
        "country": "Mısır",
        "style": "Murattal",
        "description": "AbdulBaset'in daha sade ve düz okuması. Ezberleme için ideal.",
        "specialty": "Murattal",
        "audio_quality": "Klasik kayıt",
        "recommended_for": "Ezberleme, takip etme"
    },
    "sudais": {
        "id": 3,
        "name": "Abdur-Rahman as-Sudais",
        "name_arabic": "عبد الرحمن السديس",
        "country": "Suudi Arabistan",
        "style": "Murattal",
        "description": "Mescid-i Haram imamı. Güçlü ve etkileyici sesi ile tanınır. Cuma ve teravih namazlarındaki okuması meşhurdur.",
        "specialty": "Harem tilaveti",
        "audio_quality": "Yüksek",
        "recommended_for": "Namaz, dinleme"
    },
    "husary": {
        "id": 6,
        "name": "Mahmoud Khalil Al-Husary",
        "name_arabic": "محمود خليل الحصري",
        "country": "Mısır",
        "style": "Murattal",
        "description": "Tecvid konusunda otorite kabul edilen kari. Muallim mushafı ile ünlü. Tecvid öğrenmek için ideal.",
        "specialty": "Tecvid, talim",
        "audio_quality": "Klasik kayıt",
        "recommended_for": "Tecvid öğrenme, ezberleme"
    },
    "shatri": {
        "id": 4,
        "name": "Abu Bakr al-Shatri",
        "name_arabic": "أبو بكر الشاطري",
        "country": "Suudi Arabistan",
        "style": "Murattal",
        "description": "Modern karilardan. Yumuşak ve akıcı sesi ile bilinen, dinlendirici tilaveti olan bir kari.",
        "specialty": "Yumuşak okuyuş",
        "audio_quality": "Yüksek",
        "recommended_for": "Rahatlatıcı dinleme"
    }
}

# Tecvid kuralları
TAJWEED_RULES = {
    "idgham": {
        "name": "İdğam",
        "arabic": "إدغام",
        "description": "İki harfin birleştirilmesi. Nun sakin veya tenvinden sonra ي، ن، م، و، ل، ر harfleri geldiğinde uygulanır.",
        "types": ["İdğam-ı Bila Ğunne (ل، ر)", "İdğam-ı Mea Ğunne (ي، ن، م، و)"],
        "example": "مِن يَعْمَل → miy-ya'mel"
    },
    "ikhfa": {
        "name": "İhfa",
        "arabic": "إخفاء",
        "description": "Nun sakin veya tenvinin gizlenmesi. 15 harf için uygulanır.",
        "letters": "ت، ث، ج، د، ذ، ز، س، ش، ص، ض، ط، ظ، ف، ق، ك",
        "example": "مِن قَبْل → min-qabli (hafif genizden)"
    },
    "iqlab": {
        "name": "İklab",
        "arabic": "إقلاب",
        "description": "Nun sakin veya tenvinin mim'e dönüştürülmesi. Sadece ب harfinden önce.",
        "example": "مِن بَعْد → mim-ba'd"
    },
    "izhar": {
        "name": "İzhar",
        "arabic": "إظهار",
        "description": "Nun sakin veya tenvinin açıkça okunması. Boğaz harflerinden önce: ء، ه، ع، ح، غ، خ",
        "example": "مِنْ عِنْد → min 'ind"
    },
    "madd": {
        "name": "Medd",
        "arabic": "مد",
        "description": "Uzatma. Med harfleri (ا، و، ي) ile yapılır.",
        "types": [
            "Medd-i Tabii (2 elif)",
            "Medd-i Muttasıl (4-5 elif)",
            "Medd-i Munfasıl (4-5 elif)",
            "Medd-i Lazım (6 elif)"
        ]
    },
    "qalqala": {
        "name": "Kalkale",
        "arabic": "قلقلة",
        "description": "Titretme. Sakin olduğunda ق، ط، ب، ج، د harflerinde uygulanır.",
        "example": "أَحَد → ahad (d titretilir)"
    },
    "ghunna": {
        "name": "Ğunne",
        "arabic": "غنة",
        "description": "Genizden çıkan ses. Mim ve nun harflerinde.",
        "duration": "2 elif miktarı"
    }
}


# ============= AUDIO TOOLS =============

@tool(
    "get_reciter_info",
    "Bir kari hakkında detaylı bilgi getirir",
    {"reciter": str}
)
async def get_reciter_info(args: dict[str, Any]) -> dict[str, Any]:
    """Kari bilgisi getir."""
    reciter_key = args["reciter"].lower().replace(" ", "_").replace("-", "_")

    # Arama
    for key, info in RECITERS.items():
        if reciter_key in key or reciter_key in info["name"].lower():
            return {
                "content": [{
                    "type": "text",
                    "text": json.dumps(info, ensure_ascii=False, indent=2)
                }]
            }

    # Tüm karileri listele
    all_reciters = [{"key": k, "name": v["name"]} for k, v in RECITERS.items()]
    return {
        "content": [{
            "type": "text",
            "text": f"Kari bulunamadı. Mevcut kariler:\n{json.dumps(all_reciters, ensure_ascii=False, indent=2)}"
        }]
    }


@tool(
    "list_reciters",
    "Tüm karileri listeler",
    {}
)
async def list_reciters(args: dict[str, Any]) -> dict[str, Any]:
    """Tüm karileri listele."""
    reciters_list = []
    for key, info in RECITERS.items():
        reciters_list.append({
            "id": info["id"],
            "name": info["name"],
            "style": info["style"],
            "country": info["country"],
            "recommended_for": info["recommended_for"]
        })

    return {
        "content": [{
            "type": "text",
            "text": json.dumps({"reciters": reciters_list}, ensure_ascii=False, indent=2)
        }]
    }


@tool(
    "get_audio_url",
    "Bir ayet için audio URL'ini getirir",
    {"surah": int, "ayah": int, "reciter_id": int}
)
async def get_audio_url(args: dict[str, Any]) -> dict[str, Any]:
    """Audio URL getir."""
    surah = args["surah"]
    ayah = args["ayah"]
    reciter_id = args.get("reciter_id", 7)  # Default: Mishari

    # Reciter folder mapping
    reciter_folders = {
        7: "Mishari_Rashid_Alafasy",
        1: "AbdulBaset_AbdulSamad_Mujawwad",
        2: "AbdulBaset_AbdulSamad_Murattal",
        3: "Abdurrahman_as-Sudais",
        6: "Mahmoud_Khalil_Al-Husary",
        4: "Abu_Bakr_al-Shatri"
    }

    folder = reciter_folders.get(reciter_id, "Mishari_Rashid_Alafasy")
    surah_padded = str(surah).zfill(3)
    ayah_padded = str(ayah).zfill(3)

    url = f"https://verses.quran.com/{folder}/{surah_padded}{ayah_padded}.mp3"

    return {
        "content": [{
            "type": "text",
            "text": json.dumps({
                "verse_key": f"{surah}:{ayah}",
                "reciter_id": reciter_id,
                "audio_url": url
            }, ensure_ascii=False, indent=2)
        }]
    }


@tool(
    "get_tajweed_rule",
    "Bir tecvid kuralını açıklar",
    {"rule": str}
)
async def get_tajweed_rule(args: dict[str, Any]) -> dict[str, Any]:
    """Tecvid kuralı açıkla."""
    rule_key = args["rule"].lower().replace("ğ", "g").replace("ı", "i")

    for key, info in TAJWEED_RULES.items():
        if rule_key in key or rule_key in info["name"].lower():
            return {
                "content": [{
                    "type": "text",
                    "text": json.dumps(info, ensure_ascii=False, indent=2)
                }]
            }

    # Tüm kuralları listele
    all_rules = [{"key": k, "name": v["name"], "arabic": v["arabic"]} for k, v in TAJWEED_RULES.items()]
    return {
        "content": [{
            "type": "text",
            "text": f"Kural bulunamadı. Mevcut kurallar:\n{json.dumps(all_rules, ensure_ascii=False, indent=2)}"
        }]
    }


@tool(
    "list_tajweed_rules",
    "Tüm tecvid kurallarını listeler",
    {}
)
async def list_tajweed_rules(args: dict[str, Any]) -> dict[str, Any]:
    """Tecvid kurallarını listele."""
    rules_list = []
    for key, info in TAJWEED_RULES.items():
        rules_list.append({
            "key": key,
            "name": info["name"],
            "arabic": info["arabic"],
            "description": info["description"][:100] + "..."
        })

    return {
        "content": [{
            "type": "text",
            "text": json.dumps({"tajweed_rules": rules_list}, ensure_ascii=False, indent=2)
        }]
    }


@tool(
    "get_word_timing",
    "Bir ayetin kelime kelime zamanlama verisini getirir",
    {"surah": int, "ayah": int}
)
async def get_word_timing(args: dict[str, Any]) -> dict[str, Any]:
    """Kelime zamanlaması getir."""
    surah = args["surah"]
    ayah = args["ayah"]

    surah_file = DATA_DIR / "quran-master" / f"surah-{str(surah).zfill(3)}.json"
    surah_data = load_json(surah_file)

    if not surah_data:
        return {"content": [{"type": "text", "text": "Veri bulunamadı"}], "is_error": True}

    verse_data = next((v for v in surah_data.get("verses", []) if v.get("verseNumber") == ayah), None)

    if not verse_data:
        return {"content": [{"type": "text", "text": "Ayet bulunamadı"}], "is_error": True}

    words = []
    for w in verse_data.get("words", []):
        words.append({
            "arabic": w.get("arabic", ""),
            "start_ms": w.get("startTime"),
            "end_ms": w.get("endTime"),
            "duration_ms": w.get("endTime", 0) - w.get("startTime", 0)
        })

    total_duration = sum(w["duration_ms"] for w in words)

    return {
        "content": [{
            "type": "text",
            "text": json.dumps({
                "verse_key": f"{surah}:{ayah}",
                "word_count": len(words),
                "total_duration_ms": total_duration,
                "words": words
            }, ensure_ascii=False, indent=2)
        }]
    }


# ============= AGENT SETUP =============

audio_server = create_sdk_mcp_server(
    name="audio",
    version="1.0.0",
    tools=[
        get_reciter_info,
        list_reciters,
        get_audio_url,
        get_tajweed_rule,
        list_tajweed_rules,
        get_word_timing
    ]
)

SYSTEM_PROMPT = """Sen Kur'an tilaveti ve tecvid konusunda uzmanlaşmış bir asistansın.

## Uzmanlık Alanların:
1. **Kariler:** Ünlü Kur'an karilerinin biyografileri ve okuma stilleri
2. **Tecvid:** Tüm tecvid kuralları ve uygulamaları
3. **Makamlar:** Kur'an makamları (Beyati, Saba, Hicaz, vs.)
4. **Telaffuz:** Harflerin çıkış yerleri (mahreç)

## Kari Önerileri Yaparken:
- Kullanıcının amacını sor (ezberleme, dinleme, öğrenme)
- Farklı stilleri karşılaştır (Mujawwad vs Murattal)
- Ses kalitesi ve erişilebilirliği değerlendir

## Tecvid Öğretirken:
- Kuralı basit dille açıkla
- Arapça terimini ver
- Örneklerle göster
- Yaygın hataları belirt

## Mevcut Tool'lar:
- get_reciter_info: Kari bilgisi
- list_reciters: Tüm kariler
- get_audio_url: Audio URL
- get_tajweed_rule: Tecvid kuralı
- list_tajweed_rules: Tüm kurallar
- get_word_timing: Kelime zamanlaması

Kullanıcıya sabırlı ve teşvik edici ol. Kur'an öğrenimi uzun bir yolculuktur."""


class AudioAgent:
    """Kur'an tilaveti ve tecvid asistanı."""

    def __init__(self):
        self.options = ClaudeAgentOptions(
            allowed_tools=[
                "mcp__audio__get_reciter_info",
                "mcp__audio__list_reciters",
                "mcp__audio__get_audio_url",
                "mcp__audio__get_tajweed_rule",
                "mcp__audio__list_tajweed_rules",
                "mcp__audio__get_word_timing",
            ],
            permission_mode="acceptEdits",
            system_prompt=SYSTEM_PROMPT,
            mcp_servers={"audio": audio_server}
        )

    async def interactive(self):
        """İnteraktif mod."""
        print("=" * 60)
        print("Kur'an Tilaveti ve Tecvid Asistanı")
        print("Sorularınızı yazın (örn: 'idğam nedir?')")
        print("Çıkmak için 'quit' yazın")
        print("=" * 60)

        async with ClaudeSDKClient(options=self.options) as client:
            while True:
                try:
                    user_input = input("\n🎧 > ").strip()

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
    agent = AudioAgent()

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
