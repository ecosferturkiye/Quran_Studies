#!/usr/bin/env python3
"""
Build Agent - Build ve deployment işlemleri asistanı.

Kullanım:
    python build_agent.py "Electron build yap"
    python build_agent.py --interactive
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


def run_command(cmd: str, cwd: Path = None, timeout: int = 300) -> tuple[str, str, int]:
    """Shell komutu çalıştır."""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            cwd=cwd or PROJECT_DIR,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        return result.stdout, result.stderr, result.returncode
    except subprocess.TimeoutExpired:
        return "", f"Timeout: İşlem {timeout} saniyeyi aştı", 1
    except Exception as e:
        return "", str(e), 1


# ============= BUILD TOOLS =============

@tool(
    "npm_install",
    "npm bağımlılıklarını yükler",
    {}
)
async def npm_install(args: dict[str, Any]) -> dict[str, Any]:
    """npm install çalıştır."""
    stdout, stderr, returncode = run_command("npm install", timeout=180)

    if returncode != 0:
        return {
            "content": [{"type": "text", "text": f"Hata:\n{stderr}"}],
            "is_error": True
        }

    return {
        "content": [{
            "type": "text",
            "text": f"npm install başarılı:\n{stdout[-1000:]}"
        }]
    }


@tool(
    "build_web",
    "Web versiyonunu derler (expo export)",
    {}
)
async def build_web(args: dict[str, Any]) -> dict[str, Any]:
    """Web build yap."""
    stdout, stderr, returncode = run_command("npm run build:web", timeout=300)

    if returncode != 0:
        return {
            "content": [{"type": "text", "text": f"Build hatası:\n{stderr}\n{stdout}"}],
            "is_error": True
        }

    # dist/ klasörünü kontrol et
    dist_path = PROJECT_DIR / "dist"
    if dist_path.exists():
        files = list(dist_path.rglob("*"))
        file_count = len([f for f in files if f.is_file()])
        return {
            "content": [{
                "type": "text",
                "text": f"Web build başarılı!\ndist/ klasöründe {file_count} dosya oluşturuldu."
            }]
        }

    return {
        "content": [{
            "type": "text",
            "text": f"Build tamamlandı ancak dist/ klasörü bulunamadı.\n{stdout[-500:]}"
        }]
    }


@tool(
    "run_electron",
    "Electron uygulamasını başlatır",
    {"build_first": bool}
)
async def run_electron(args: dict[str, Any]) -> dict[str, Any]:
    """Electron başlat."""
    build_first = args.get("build_first", True)

    if build_first:
        # Önce web build
        stdout, stderr, returncode = run_command("npm run build:web", timeout=300)
        if returncode != 0:
            return {
                "content": [{"type": "text", "text": f"Web build hatası:\n{stderr}"}],
                "is_error": True
            }

    # Electron başlat (arka planda)
    try:
        process = subprocess.Popen(
            "npm run electron",
            shell=True,
            cwd=PROJECT_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        # Kısa bir süre bekle ve başlangıcı kontrol et
        await asyncio.sleep(3)

        if process.poll() is None:  # Hala çalışıyor
            return {
                "content": [{
                    "type": "text",
                    "text": "Electron uygulaması başlatıldı! (Arka planda çalışıyor)"
                }]
            }
        else:
            stdout, stderr = process.communicate()
            return {
                "content": [{"type": "text", "text": f"Electron başlatılamadı:\n{stderr}"}],
                "is_error": True
            }

    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Hata: {e}"}],
            "is_error": True
        }


@tool(
    "check_build_status",
    "Build durumunu ve dist/ klasörünü kontrol eder",
    {}
)
async def check_build_status(args: dict[str, Any]) -> dict[str, Any]:
    """Build durumu kontrolü."""
    status = {
        "node_modules": (PROJECT_DIR / "node_modules").exists(),
        "dist": (PROJECT_DIR / "dist").exists(),
        "electron_main": (PROJECT_DIR / "electron" / "main.js").exists(),
        "package_json": (PROJECT_DIR / "package.json").exists(),
    }

    # dist/ detayları
    if status["dist"]:
        dist_path = PROJECT_DIR / "dist"
        files = list(dist_path.rglob("*"))
        status["dist_files"] = len([f for f in files if f.is_file()])
        status["dist_size_mb"] = round(sum(f.stat().st_size for f in files if f.is_file()) / (1024 * 1024), 2)

    # package.json scripts
    if status["package_json"]:
        with open(PROJECT_DIR / "package.json", "r") as f:
            pkg = json.load(f)
        status["scripts"] = list(pkg.get("scripts", {}).keys())

    return {
        "content": [{
            "type": "text",
            "text": json.dumps(status, ensure_ascii=False, indent=2)
        }]
    }


@tool(
    "run_dev_server",
    "Expo geliştirme sunucusunu başlatır",
    {"platform": str}
)
async def run_dev_server(args: dict[str, Any]) -> dict[str, Any]:
    """Dev server başlat."""
    platform = args.get("platform", "web")  # web, ios, android

    cmd_map = {
        "web": "npx expo start --web",
        "ios": "npx expo start --ios",
        "android": "npx expo start --android",
    }

    if platform not in cmd_map:
        return {
            "content": [{"type": "text", "text": f"Geçersiz platform: {platform}"}],
            "is_error": True
        }

    try:
        process = subprocess.Popen(
            cmd_map[platform],
            shell=True,
            cwd=PROJECT_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        # Başlangıcı bekle
        await asyncio.sleep(5)

        if process.poll() is None:
            return {
                "content": [{
                    "type": "text",
                    "text": f"Expo dev server ({platform}) başlatıldı!\nWeb: http://localhost:8081"
                }]
            }
        else:
            stdout, stderr = process.communicate()
            return {
                "content": [{"type": "text", "text": f"Başlatılamadı:\n{stderr}"}],
                "is_error": True
            }

    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Hata: {e}"}],
            "is_error": True
        }


@tool(
    "clean_build",
    "Build cache ve dist/ klasörünü temizler",
    {}
)
async def clean_build(args: dict[str, Any]) -> dict[str, Any]:
    """Build temizle."""
    import shutil

    cleaned = []

    # dist/ temizle
    dist_path = PROJECT_DIR / "dist"
    if dist_path.exists():
        shutil.rmtree(dist_path)
        cleaned.append("dist/")

    # .expo/ temizle
    expo_path = PROJECT_DIR / ".expo"
    if expo_path.exists():
        shutil.rmtree(expo_path)
        cleaned.append(".expo/")

    # metro cache temizle
    metro_cache = PROJECT_DIR / "node_modules" / ".cache" / "metro"
    if metro_cache.exists():
        shutil.rmtree(metro_cache)
        cleaned.append("node_modules/.cache/metro/")

    return {
        "content": [{
            "type": "text",
            "text": f"Temizlenen klasörler:\n" + "\n".join(f"- {c}" for c in cleaned) if cleaned else "Temizlenecek bir şey yok."
        }]
    }


# ============= AGENT SETUP =============

build_server = create_sdk_mcp_server(
    name="build",
    version="1.0.0",
    tools=[npm_install, build_web, run_electron, check_build_status, run_dev_server, clean_build]
)

SYSTEM_PROMPT = """Sen build ve deployment konusunda uzmanlaşmış bir yapay zeka asistanısın.

## Görevlerin:
1. Web ve Electron build işlemlerini yönetmek
2. Geliştirme sunucusunu başlatmak
3. Build hatalarını tespit ve çözmek
4. Cache ve temp dosyaları temizlemek
5. Build durumunu raporlamak

## Proje Yapısı:
- **Framework**: React Native + Expo
- **Electron**: Desktop wrapper
- **Build**: npx expo export --platform web
- **Output**: dist/ klasörü

## Build Komutları:
- `npm run build:web` - Web export
- `npm run electron` - Electron build & run
- `npx expo start --web` - Dev server

## Kuralların:
- Build öncesi bağımlılıkları kontrol et
- Hataları net açıkla
- Cache temizliği öner (gerekirse)
- Platform-specific sorunları belirt

## Mevcut Tool'lar:
- npm_install: Bağımlılık yükle
- build_web: Web build
- run_electron: Electron başlat
- check_build_status: Durum kontrolü
- run_dev_server: Dev server
- clean_build: Cache temizle"""


class BuildAgent:
    """Build ve deployment asistanı."""

    def __init__(self):
        self.options = ClaudeAgentOptions(
            allowed_tools=[
                "mcp__build__npm_install",
                "mcp__build__build_web",
                "mcp__build__run_electron",
                "mcp__build__check_build_status",
                "mcp__build__run_dev_server",
                "mcp__build__clean_build",
            ],
            permission_mode="acceptEdits",
            system_prompt=SYSTEM_PROMPT,
            mcp_servers={"build": build_server}
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
        print("Build Agent - Build & Deployment Asistanı")
        print("Çıkmak için 'quit' yazın")
        print("=" * 60)

        async with ClaudeSDKClient(options=self.options) as client:
            while True:
                try:
                    user_input = input("\n🔨 Komut: ").strip()

                    if user_input.lower() in ["quit", "exit", "q"]:
                        print("Çıkış yapılıyor...")
                        break

                    if not user_input:
                        continue

                    print("\n⚙️ İşlem:")
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
    agent = BuildAgent()

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
