import requests
import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Load complete.json
url = "https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/complete.json"
r = requests.get(url)
data = r.json()

char_hsk = {}
for entry in data:
    simp = entry.get('simplified', '')
    levels = entry.get('level', [])
    if len(simp) == 1:
        lvl_nums = []
        for l in levels:
            nums = [int(n) for n in re.findall(r'\d+', l)]
            lvl_nums.extend(nums)
        if lvl_nums:
            min_lvl = min(lvl_nums)
            if simp not in char_hsk or min_lvl < char_hsk[simp]:
                char_hsk[simp] = min_lvl

# Also check multi-character HSK words to infer character HSK if single char was unlisted
for entry in data:
    simp = entry.get('simplified', '')
    levels = entry.get('level', [])
    lvl_nums = []
    for l in levels:
        nums = [int(n) for n in re.findall(r'\d+', l)]
        lvl_nums.extend(nums)
    if lvl_nums:
        min_lvl = min(lvl_nums)
        for char in simp:
            if '\u4e00' <= char <= '\u9fff':
                if char not in char_hsk or min_lvl < char_hsk[char]:
                    char_hsk[char] = min_lvl

# Check coverage against our 1000 characters
with open('packages/app/public/seed-data.json', 'r', encoding='utf-8') as f:
    seed = json.load(f)

top1000 = [c['id'] for c in seed['characters']]
matched = sum(1 for c in top1000 if c in char_hsk)

print(f"Total Top 1000 characters: {len(top1000)}")
print(f"Matched with HSK level: {matched} / {len(top1000)} ({matched/len(top1000)*100:.1f}%)")

hsk_counts = {}
for c in top1000:
    lvl = char_hsk.get(c, '7-9')
    hsk_counts[lvl] = hsk_counts.get(lvl, 0) + 1

print("HSK Level distribution:")
for lvl in sorted(hsk_counts.keys(), key=lambda x: int(x) if isinstance(x, int) or x.isdigit() else 99):
    print(f"  HSK {lvl}: {hsk_counts[lvl]} characters")
