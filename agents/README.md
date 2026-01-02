# Quran Agents

Claude Agent SDK ile oluşturulmuş Kur'an asistanları.

## Kurulum

```bash
pip install claude-agent-sdk
```

## Agent'lar

### 1. Quran Agent (`quran_agent.py`)

Kur'an okuma ve araştırma asistanı.

**Özellikler:**
- Ayet getirme ve açıklama
- Çoklu çeviri karşılaştırma
- Kelime kelime analiz
- Arama

**Kullanım:**
```bash
# Tek soru
python quran_agent.py "Fatiha suresinin 1. ayetini açıkla"

# İnteraktif mod
python quran_agent.py --interactive
```

### 2. Learning Agent (`learning_agent.py`)

Kur'an Arapçası öğrenme asistanı.

**Özellikler:**
- Flashcard çalışması
- SM-2 Spaced Repetition
- İlerleme takibi
- Kelime kökü açıklamaları
- Quiz modu

**Kullanım:**
```bash
# Quiz modu (10 kelime)
python learning_agent.py --quiz

# Quiz modu (20 kelime)
python learning_agent.py --quiz 20

# İnteraktif mod
python learning_agent.py --interactive

# Tek soru
python learning_agent.py "bugün hangi kelimeleri çalışmalıyım?"
```

## Tool'lar

### Quran Agent Tool'ları
| Tool | Açıklama |
|------|----------|
| `get_verse` | Ayet ve çevirileri getir |
| `search_quran` | Anahtar kelime ara |
| `get_word_details` | Kelime zamanlamaları |
| `get_vocabulary` | Kelime listeleri |
| `get_surah_list` | Sure listesi |

### Learning Agent Tool'ları
| Tool | Açıklama |
|------|----------|
| `get_flashcards` | Çalışılacak kartlar |
| `get_learning_stats` | İstatistikler |
| `record_review` | Sonuç kaydet |
| `explain_root` | Kök açıklama |
| `get_due_cards` | Bugün tekrar kartları |

## İlerleme Dosyası

Learning agent ilerlemeyi `learning_progress.json` dosyasında saklar:

```json
{
  "cards": {
    "word_1": {
      "repetitions": 3,
      "ease_factor": 2.5,
      "interval": 6,
      "mastery": "learning"
    }
  },
  "streak": 5,
  "total_reviews": 150,
  "last_study": "2025-01-15"
}
```

## Özelleştirme

System prompt'ları değiştirmek için ilgili agent dosyasındaki `SYSTEM_PROMPT` değişkenini düzenleyin.
