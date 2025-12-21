import json
import urllib.request
import os
import re
import time

# Fetch Abdel Haleem translation from Quran.com API (surah by surah)
BASE_URL = "https://api.quran.com/api/v4/verses/by_chapter"
TRANSLATION_ID = 85  # Abdel Haleem

print("Fetching Abdel Haleem translation (surah by surah)...")

all_translations = {}

for surah_id in range(1, 115):  # 114 surahs
    url = f"{BASE_URL}/{surah_id}?translations={TRANSLATION_ID}&per_page=300"

    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())

        verses = data.get("verses", [])
        all_translations[surah_id] = {}

        for verse in verses:
            verse_number = verse.get("verse_number", 0)
            translations = verse.get("translations", [])

            if translations:
                text = translations[0].get("text", "")
                # Clean HTML
                text = re.sub(r'<sup[^>]*>.*?</sup>', '', text)
                text = re.sub(r'<[^>]+>', '', text)
                text = text.strip()
                all_translations[surah_id][verse_number] = text

        print(f"Surah {surah_id}: {len(verses)} verses")

        # Small delay to avoid rate limiting
        time.sleep(0.1)

    except Exception as e:
        print(f"Error fetching surah {surah_id}: {e}")

# Save to JSON
output_path = os.path.join(os.path.dirname(__file__), "..", "src", "data", "quran", "quran_haleem.json")

with open(output_path, "w", encoding="utf-8") as f:
    json.dump(all_translations, f, ensure_ascii=False, indent=2)

print(f"\nSaved to {output_path}")

# Show sample
print("\nSample (Fatiha):")
for verse_id in sorted(all_translations[1].keys()):
    print(f"  {verse_id}: {all_translations[1][verse_id]}")

print(f"\nTotal surahs: {len(all_translations)}")
total_verses = sum(len(v) for v in all_translations.values())
print(f"Total verses: {total_verses}")
