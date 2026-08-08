import gzip
import json
import re
import sys

from pinyin_utils import convert_pinyin_str

sys.stdout.reconfigure(encoding='utf-8')

NOISE_RE = re.compile(r'^(used in|variant of|old variant of|archaic variant of|surname|see|same as|CL:)', re.IGNORECASE)

def clean_cedict_definition(d: str) -> str:
    # Remove traditional character references like [shang3 sheng1] or 裡|里
    d = re.sub(r'\[[a-zA-Z0-9\s]+\]', '', d)
    d = re.sub(r'[\u4e00-\u9fff]+\|[\u4e00-\u9fff]+', '', d)
    d = d.strip()
    return d

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
                
                # Check if this entry is pure noise
                valid_defs = []
                for d in defs:
                    if not NOISE_RE.match(d):
                        cleaned = clean_cedict_definition(d)
                        if cleaned and len(cleaned) > 1:
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
                    mmh[c] = {
                        'definition': d.get('definition', ''),
                        'pinyin': [convert_pinyin_str(p) for p in d.get('pinyin', [])]
                    }
    return mmh

cedict = get_clean_cedict()
mmh = get_mmh_dict()

# Test top characters
test_chars = ['上', '万', '个', '人', '那', '能', '过', '还', '里', '以', '都', '时', '也', '和', '谢', '我', '的', '是']

for c in test_chars:
    m = mmh.get(c, {})
    ce = cedict.get(c, [])
    
    # Combine pinyin: MMH first, then CEDICT
    pinyins = list(m.get('pinyin', []))
    for entry in ce:
        py = entry['pinyin']
        if py not in pinyins:
            pinyins.append(py)
            
    # Combine defs: MMH first, then CEDICT valid defs
    defs = []
    if m.get('definition'):
        for p in m['definition'].split(';'):
            p = p.strip()
            if p and p not in defs:
                defs.append(p)
                
    for entry in ce:
        for d in entry['definitions']:
            if d not in defs and len(defs) < 4:
                defs.append(d)
                
    print(f"Char: {c}")
    print(f"  Pinyin: {pinyins}")
    print(f"  Defs: {defs}")
