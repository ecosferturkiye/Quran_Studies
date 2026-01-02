# Quran MCP Server

Bu MCP Server, Kur'an verilerine Claude ve diğer AI agent'lar üzerinden erişim sağlar.

## Kurulum

```bash
cd mcp-server
npm install
npm run build
```

## Claude Code'a Bağlama

`.claude/settings.json` dosyasına ekleyin:

```json
{
  "mcpServers": {
    "quran": {
      "command": "node",
      "args": ["C:/Users/aydin/OneDrive/Masaüstü/ClaudeCode/Test/next-linear-quran/mcp-server/dist/index.js"]
    }
  }
}
```

## Sunulan Tool'lar

| Tool | Açıklama |
|------|----------|
| `get_verse` | Belirli bir ayet ve tüm çevirilerini al |
| `search_verses` | Ayetlerde anahtar kelime ara |
| `get_surah_info` | Surah meta bilgisi |
| `get_word_timing` | Kelime-kelime zamanlama verisi |
| `get_vocabulary` | Öğrenme kelime listesi |
| `list_surahs` | Tüm surelerin listesi |
| `get_available_translations` | Mevcut çeviriler |

## Kullanım Örnekleri

### Ayet Getir
```
get_verse(surah: 1, ayah: 1)
```

### Arama Yap
```
search_verses(query: "mercy", limit: 5)
```

### Kelime Zamanlaması
```
get_word_timing(surah: 1, ayah: 1)
```

### Kelime Öğren
```
get_vocabulary(category: "words", limit: 10)
```
