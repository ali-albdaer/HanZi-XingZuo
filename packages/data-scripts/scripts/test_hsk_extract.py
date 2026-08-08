import requests
import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

url = "https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/complete.json"
r = requests.get(url)
data = r.json()

char_hsk = {}
for entry in data:
    simp = entry.get('simplified', '')
    levels = entry.get('level', [])
    if len(simp) == 1:
        # Extract lowest level number if multiple
        lvl_nums = []
        for l in levels:
            # Format could be "old-1", "new-1", "newest-1", "1", etc.
            nums = [int(n) for n in re.findall(r'\d+', l)]
            lvl_nums.extend(nums)
        if lvl_nums:
            min_lvl = min(lvl_nums)
            if simp not in char_hsk or min_lvl < char_hsk[simp]:
                char_hsk[simp] = min_lvl

print("Single characters with HSK level in complete.json:", len(char_hsk))
sample_chars = ['我', '你', '是', '好', '不', '上', '万', '看', '做', '爱', '繁', '饕']
for c in sample_chars:
    print(f"Char {c}: HSK {char_hsk.get(c, 'Non-HSK / 7-9')}")
