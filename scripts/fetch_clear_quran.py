import json
import urllib.request
import os
import re

# Download Clear Quran TXT from archive.org
TXT_URL = "https://archive.org/download/the-clear-quran-a-thematic-english-translation-allah-edition-dr.-mustafa-khattab-2017-bc-2-c-0-ddb/The_Clear_Quran_A_Thematic_English_Translation_Allah_edition_--_Dr._Mustafa_Khattab_2017_BC2C0DDB_djvu.txt"

print("Downloading Clear Quran TXT file...")

try:
    # Download the file
    req = urllib.request.Request(TXT_URL, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        content = response.read().decode('utf-8', errors='ignore')

    print(f"Downloaded {len(content)} characters")

    # Save raw file for inspection
    raw_path = os.path.join(os.path.dirname(__file__), "clear_quran_raw.txt")
    with open(raw_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Saved raw file to {raw_path}")

    # Show first 5000 chars for analysis
    print("\n=== First 5000 characters ===")
    print(content[:5000])

    print("\n=== Searching for verse patterns ===")
    # Look for patterns like "1." or "1:" at start of lines
    lines = content.split('\n')
    for i, line in enumerate(lines[:200]):
        if re.match(r'^\d+[\.\:]\s', line.strip()):
            print(f"Line {i}: {line[:100]}")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
