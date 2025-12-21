import json
import urllib.request
import os

# Fetch Study Quran from fawazahmed0/quran-api
# Source: https://github.com/fawazahmed0/quran-api

API_URL = "https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/eng-thestudyquran.json"

print("Fetching Study Quran from API...")

# Fetch the data
with urllib.request.urlopen(API_URL) as response:
    raw_data = json.loads(response.read().decode('utf-8'))
    data = raw_data['quran']  # Data is under 'quran' key

print(f"Received {len(data)} verses")

# Convert to our format: {surah: {verse: text}}
result = {}

for verse_data in data:
    chapter = verse_data['chapter']
    verse = verse_data['verse']
    text = verse_data['text']

    chapter_str = str(chapter)
    verse_str = str(verse)

    if chapter_str not in result:
        result[chapter_str] = {}

    result[chapter_str][verse_str] = text

# Verify coverage
VERSE_COUNTS = {
    1: 7, 2: 286, 3: 200, 4: 176, 5: 120, 6: 165, 7: 206, 8: 75, 9: 129, 10: 109,
    11: 123, 12: 111, 13: 43, 14: 52, 15: 99, 16: 128, 17: 111, 18: 110, 19: 98, 20: 135,
    21: 112, 22: 78, 23: 118, 24: 64, 25: 77, 26: 227, 27: 93, 28: 88, 29: 69, 30: 60,
    31: 34, 32: 30, 33: 73, 34: 54, 35: 45, 36: 83, 37: 182, 38: 88, 39: 75, 40: 85,
    41: 54, 42: 53, 43: 89, 44: 59, 45: 37, 46: 35, 47: 38, 48: 29, 49: 18, 50: 45,
    51: 60, 52: 49, 53: 62, 54: 55, 55: 78, 56: 96, 57: 29, 58: 22, 59: 24, 60: 13,
    61: 14, 62: 11, 63: 11, 64: 18, 65: 12, 66: 12, 67: 30, 68: 52, 69: 52, 70: 44,
    71: 28, 72: 28, 73: 20, 74: 56, 75: 40, 76: 31, 77: 50, 78: 40, 79: 46, 80: 42,
    81: 29, 82: 19, 83: 36, 84: 25, 85: 22, 86: 17, 87: 19, 88: 26, 89: 30, 90: 20,
    91: 15, 92: 21, 93: 11, 94: 8, 95: 8, 96: 19, 97: 5, 98: 8, 99: 8, 100: 11,
    101: 11, 102: 8, 103: 3, 104: 9, 105: 5, 106: 4, 107: 7, 108: 3, 109: 6, 110: 3,
    111: 5, 112: 4, 113: 5, 114: 6
}

total_expected = sum(VERSE_COUNTS.values())
total_found = sum(len(v) for v in result.values())

print(f"\nTotal surahs: {len(result)}")
print(f"Total verses: {total_found}/{total_expected}")
print(f"Coverage: {100 * total_found / total_expected:.1f}%")

# Check for missing verses
missing = []
for surah in range(1, 115):
    expected = VERSE_COUNTS[surah]
    found = len(result.get(str(surah), {}))
    if found < expected:
        missing.append(f"Surah {surah}: {found}/{expected}")

if missing:
    print(f"\nMissing verses in {len(missing)} surahs:")
    for m in missing[:10]:
        print(f"  {m}")
else:
    print("\nAll verses present!")

# Save the result
output_path = os.path.join(os.path.dirname(__file__), "..", "src", "data", "quran", "quran_studyquran.json")

with open(output_path, "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f"\nSaved to {output_path}")
