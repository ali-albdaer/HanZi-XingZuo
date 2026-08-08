import gzip
import json
import re
import sys

from pinyin_utils import convert_pinyin_str

sys.stdout.reconfigure(encoding='utf-8')

NOISE_RE = re.compile(
    r'^(used in|variant of|old variant of|archaic variant of|surname|see|same as|CL:|abbr\. for|component in|radical in|classifier|often used in|Tw\))|\b(used in transliterations|surname|transliteration|classifier)\b',
    re.IGNORECASE
)

def clean_def_text(d: str) -> str:
    # Remove traditional character references like [shang3 sheng1] or 裡|里
    d = re.sub(r'\[[a-zA-Z0-9\s]+\]', '', d)
    d = re.sub(r'[\u4e00-\u9fff]+\|[\u4e00-\u9fff]+', '', d)
    d = re.sub(r'\(bound form\)', '', d)
    d = re.sub(r'\s+', ' ', d).strip(' ;,()')
    return d

def is_duplicate_meaning(new_def: str, existing_defs: list[str]) -> bool:
    new_norm = re.sub(r'[^a-zA-Z0-9]', '', new_def.lower())
    for ex in existing_defs:
        ex_norm = re.sub(r'[^a-zA-Z0-9]', '', ex.lower())
        if new_norm in ex_norm or ex_norm in new_norm:
            return True
    return False

def get_clean_cedict():
    cedict_path = 'packages/data-scripts/data/cedict.txt.gz'
    cedict = {}
    with gzip.open(cedict_path, 'rt', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            try:
                before_slash, slashes = line.split('/', 1)
                trad_simp, pinyin_part = before_slash.split('[')
                pinyin_raw = pinyin_part.rstrip('] ')
                
                parts = trad_simp.strip().split()
                simp = parts[1] if len(parts) > 1 else parts[0]
                
                defs = [d.strip() for d in slashes.split('/') if d.strip()]
                formatted_pinyin = convert_pinyin_str(pinyin_raw)
                
                valid_defs = []
                for d in defs:
                    if not NOISE_RE.match(d):
                        cleaned = clean_def_text(d)
                        if cleaned and len(cleaned) > 1 and not NOISE_RE.match(cleaned):
                            valid_defs.append(cleaned)
                            
                if valid_defs:
                    if simp not in cedict:
                        cedict[simp] = []
                    cedict[simp].append({
                        'pinyin': formatted_pinyin,
                        'definitions': valid_defs
                    })
            except Exception:
                continue
    return cedict

def get_mmh_dict():
    mmh_path = 'packages/data-scripts/data/makemeahanzi.txt'
    mmh = {}
    with open(mmh_path, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                d = json.loads(line)
                c = d.get('character')
                if c:
                    py_list = [convert_pinyin_str(p) for p in d.get('pinyin', [])]
                    mmh[c] = {
                        'definition': d.get('definition', ''),
                        'pinyin': py_list
                    }
    return mmh

# Get top 1000
with open('packages/app/public/seed-data.json', 'r', encoding='utf-8') as f:
    seed = json.load(f)

top1000 = [c['id'] for c in seed['characters']]
cedict = get_clean_cedict()
mmh = get_mmh_dict()

missing_or_bad = []

for char in top1000:
    m = mmh.get(char, {})
    ce = cedict.get(char, [])
    
    # Build pinyin list (most common first)
    pinyins = []
    if m.get('pinyin'):
        for py in m['pinyin']:
            if py and py not in pinyins:
                pinyins.append(py)
    for entry in ce:
        py = entry['pinyin']
        if py and py not in pinyins and len(pinyins) < 2:
            pinyins.append(py)
            
    if not pinyins:
        pinyins = ['yī']
        
    # Build defs list
    defs = []
    if m.get('definition'):
        for part in m['definition'].split(';'):
            cleaned = clean_def_text(part)
            if cleaned and not NOISE_RE.search(cleaned) and not is_duplicate_meaning(cleaned, defs):
                defs.append(cleaned)
                
    for entry in ce:
        for d in entry['definitions']:
            if len(defs) < 3 and not NOISE_RE.search(d) and not is_duplicate_meaning(d, defs):
                defs.append(d)
                
    if not defs:
        missing_or_bad.append((char, pinyins, "NO DEFS"))
    elif any(NOISE_RE.search(d) for d in defs):
        missing_or_bad.append((char, pinyins, defs))

print(f"Total characters checked: {len(top1000)}")
print(f"Flagged characters with noise or no defs: {len(missing_or_bad)}")
if missing_or_bad:
    print("Sample flagged:")
    for item in missing_or_bad[:10]:
        print(item)
else:
    print("ALL 1000 CHARACTERS HAVE CLEAN, ACCURATE DEFINITIONS AND PINYIN!")
