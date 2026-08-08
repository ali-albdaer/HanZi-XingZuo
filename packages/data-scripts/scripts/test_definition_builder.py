import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Load MakeMeAHanzi
mmh_map = {}
with open('packages/data-scripts/data/makemeahanzi.txt', 'r', encoding='utf-8') as f:
    for line in f:
        if line.strip():
            d = json.loads(line)
            char = d.get('character')
            if char:
                mmh_map[char] = {
                    'definition': d.get('definition', ''),
                    'pinyin': d.get('pinyin', [])
                }

# Load seed data characters
with open('packages/app/public/seed-data.json', 'r', encoding='utf-8') as f:
    seed = json.load(f)

test_chars = ['上', '万', '个', '人', '那', '能', '过', '还', '里', '以', '都', '时', '也', '和', '谢', '我', '的', '是']

def clean_mmh_defs(def_str: str) -> list[str]:
    if not def_str:
        return []
    # Split by semicolon or comma where appropriate
    parts = [p.strip() for p in def_str.split(';') if p.strip()]
    return parts

for c in test_chars:
    mmh = mmh_map.get(c, {})
    raw_mmh_def = mmh.get('definition', '')
    parsed_defs = clean_mmh_defs(raw_mmh_def)
    py = mmh.get('pinyin', [])
    print(f"Char: {c}")
    print(f"  Pinyin: {py}")
    print(f"  Curated Defs: {parsed_defs}")
