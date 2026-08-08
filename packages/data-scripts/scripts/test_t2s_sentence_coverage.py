import bz2
import json
import os
import sys
from opencc import OpenCC

sys.stdout.reconfigure(encoding='utf-8')
cc = OpenCC('t2s')

# Load top 1000 set
with open('packages/app/public/seed-data.json', 'r', encoding='utf-8') as f:
    seed = json.load(f)

top1000_chars = [c['id'] for c in seed['characters']]
top1000_set = set(top1000_chars)

# Load raw Tatoeba sentences
DATA_DIR = 'packages/data-scripts/data'
cmn_path = os.path.join(DATA_DIR, 'cmn_sentences.tsv.bz2')
eng_path = os.path.join(DATA_DIR, 'eng_sentences.tsv.bz2')
links_path = os.path.join(DATA_DIR, 'cmn-eng_links.tsv.bz2')

cmn_map = {}
with bz2.open(cmn_path, 'rt', encoding='utf-8') as f:
    for line in f:
        parts = line.strip().split('\t')
        if len(parts) >= 3:
            sid, text = parts[0], parts[2]
            if len(text) <= 12:
                # Convert Traditional to Simplified!
                simp_text = cc.convert(text)
                cmn_map[sid] = simp_text

cmn_to_eng = {}
with bz2.open(links_path, 'rt', encoding='utf-8') as f:
    for line in f:
        parts = line.strip().split('\t')
        if len(parts) >= 2:
            csid, esid = parts[0], parts[1]
            if csid in cmn_map and csid not in cmn_to_eng:
                cmn_to_eng[csid] = esid

eng_needed = set(cmn_to_eng.values())
eng_map = {}
with bz2.open(eng_path, 'rt', encoding='utf-8') as f:
    for line in f:
        parts = line.strip().split('\t')
        if len(parts) >= 3:
            sid, text = parts[0], parts[2]
            if sid in eng_needed:
                eng_map[sid] = text

pairs = []
for csid, esid in cmn_to_eng.items():
    if esid in eng_map:
        pairs.append((cmn_map[csid], eng_map[esid]))

print(f"Total short Chinese-English sentence pairs: {len(pairs)}")

# Map to top 1000 characters prioritizing 100% top 1000 character composition
char_sentences = {c: [] for c in top1000_chars}

# Pass 1: 100% top-1000 character composition
for c_text, e_text in pairs:
    c_chars = [c for c in c_text if '\u4e00' <= c <= '\u9fff']
    if not c_chars:
        continue
    # Check if ALL characters in sentence are in top 1000
    if all(c in top1000_set for c in c_chars):
        for c in c_chars:
            if c in char_sentences and len(char_sentences[c]) < 3:
                if not any(s[0] == c_text for s in char_sentences[c]):
                    char_sentences[c].append((c_text, e_text, 1.0))

# Pass 2: >= 85% top-1000 character composition
for c_text, e_text in pairs:
    c_chars = [c for c in c_text if '\u4e00' <= c <= '\u9fff']
    if not c_chars:
        continue
    in_cnt = sum(1 for c in c_chars if c in top1000_set)
    ratio = in_cnt / len(c_chars)
    if ratio >= 0.85:
        for c in c_chars:
            if c in char_sentences and len(char_sentences[c]) < 3:
                if not any(s[0] == c_text for s in char_sentences[c]):
                    char_sentences[c].append((c_text, e_text, ratio))

# Report sentence distribution
s_counts = {0: 0, 1: 0, 2: 0, 3: 0}
ratios = []
for c in top1000_chars:
    cnt = len(char_sentences[c])
    s_counts[cnt] += 1
    for s in char_sentences[c]:
        ratios.append(s[2])

print("\nCharacter sentence counts from Tatoeba:")
for k, v in s_counts.items():
    print(f"  {k} sentences: {v} characters")

avg_ratio = sum(ratios) / len(ratios) if ratios else 0
perfect_pct = sum(1 for r in ratios if r == 1.0) / len(ratios) * 100 if ratios else 0
print(f"\nTotal assigned Tatoeba sentences: {len(ratios)}")
print(f"Average Top-1000 character coverage: {avg_ratio*100:.1f}%")
print(f"Sentences with 100% Top-1000 character coverage: {perfect_pct:.1f}%")
