import os
import sys
import json
import gzip
import bz2
import io
import zipfile
import re
import requests
import jieba
from pypinyin import pinyin, Style

from pinyin_utils import convert_pinyin_str

sys.stdout.reconfigure(encoding='utf-8')

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'app', 'public')
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

def download_file(url: str, filename: str) -> str:
    filepath = os.path.join(DATA_DIR, filename)
    if os.path.exists(filepath):
        print(f"[CACHE] {filename} already exists.")
        return filepath
    
    print(f"[DOWNLOADING] {url} -> {filename}...")
    r = requests.get(url, headers=HEADERS, stream=True)
    r.raise_for_status()
    with open(filepath, 'wb') as f:
        for chunk in r.iter_content(chunk_size=8192):
            f.write(chunk)
    print(f"[DONE] Saved {filename}")
    return filepath

def get_subtlex_top1000():
    url = "https://journals.plos.org/plosone/article/file?id=10.1371/journal.pone.0010729.s002&type=supplementary"
    zip_path = download_file(url, "subtlex.zip")
    
    z = zipfile.ZipFile(zip_path)
    with z.open('SUBTLEX-CH-CHR') as f:
        lines = f.read().decode('gbk').splitlines()
    
    top_chars = []
    # Lines 0-2 are headers
    for line in lines[3:]:
        parts = line.split('\t')
        if len(parts) >= 2:
            char = parts[0].strip()
            # Filter valid single CJK character
            if char and len(char) == 1 and '\u4e00' <= char <= '\u9fff':
                if char not in top_chars:
                    top_chars.append(char)
                    if len(top_chars) == 1000:
                        break
    print(f"[SUBTLEX-CH] Loaded top {len(top_chars)} characters.")
    return top_chars

NOISE_RE = re.compile(
    r'^(used in|variant of|old variant of|archaic variant of|surname|see|same as|CL:|abbr\. for|component in|radical in|classifier|often used in|Tw\))|\b(used in transliterations|surname|transliteration|classifier)\b',
    re.IGNORECASE
)

def clean_def_text(d: str) -> str:
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

def get_cedict_dictionary():
    url = "https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz"
    gz_path = download_file(url, "cedict.txt.gz")
    
    dict_map = {}
    with gzip.open(gz_path, 'rt', encoding='utf-8') as f:
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
                    if not NOISE_RE.search(d):
                        cleaned = clean_def_text(d)
                        if cleaned and len(cleaned) > 1 and not NOISE_RE.search(cleaned):
                            valid_defs.append(cleaned)
                            
                if valid_defs:
                    if simp not in dict_map:
                        dict_map[simp] = []
                    dict_map[simp].append({
                        'pinyin': formatted_pinyin,
                        'definitions': valid_defs
                    })
            except Exception:
                continue
                
    print(f"[CC-CEDICT] Loaded clean dictionary entries for {len(dict_map)} simplified words.")
    return dict_map

def get_makemeahanzi_data():
    url = "https://raw.githubusercontent.com/skishore/makemeahanzi/master/dictionary.txt"
    txt_path = download_file(url, "makemeahanzi.txt")
    
    hanzi_map = {}
    struct_ops = set("⿰⿱⿲⿳⿴⿵⿶⿷⿸⿹⿺⿻？")
    
    with open(txt_path, 'r', encoding='utf-8') as f:
        for line in f:
            if not line.strip():
                continue
            data = json.loads(line)
            char = data.get("character")
            if not char:
                continue
            
            radical = data.get("radical", "")
            decomp = data.get("decomposition", "")
            py_list = [convert_pinyin_str(p) for p in data.get("pinyin", [])]
            
            components = []
            for c in decomp:
                if c not in struct_ops and c != char and '\u4e00' <= c <= '\u9fff':
                    if c not in components:
                        components.append(c)
            
            hanzi_map[char] = {
                'radical': radical,
                'components': components,
                'definition': data.get("definition", ""),
                'pinyin': py_list
            }
            
    print(f"[MakeMeAHanzi] Loaded metadata for {len(hanzi_map)} characters.")
    return hanzi_map

def get_tatoeba_sentences(top1000_set):
    url_cmn = "https://downloads.tatoeba.org/exports/per_language/cmn/cmn_sentences.tsv.bz2"
    url_eng = "https://downloads.tatoeba.org/exports/per_language/eng/eng_sentences.tsv.bz2"
    url_links = "https://downloads.tatoeba.org/exports/per_language/cmn/cmn-eng_links.tsv.bz2"
    
    cmn_path = download_file(url_cmn, "cmn_sentences.tsv.bz2")
    eng_path = download_file(url_eng, "eng_sentences.tsv.bz2")
    links_path = download_file(url_links, "cmn-eng_links.tsv.bz2")
    
    print("[TATOEBA] Reading Chinese sentences...")
    cmn_map = {}
    with bz2.open(cmn_path, 'rt', encoding='utf-8') as f:
        for line in f:
            parts = line.strip().split('\t')
            if len(parts) >= 3:
                sid, lang, text = parts[0], parts[1], parts[2]
                if len(text) <= 12: # Only short sentences for mobile practice
                    cmn_map[sid] = text
                    
    print("[TATOEBA] Reading Links...")
    cmn_to_eng = {}
    with bz2.open(links_path, 'rt', encoding='utf-8') as f:
        for line in f:
            parts = line.strip().split('\t')
            if len(parts) >= 2:
                csid, esid = parts[0], parts[1]
                if csid in cmn_map and csid not in cmn_to_eng:
                    cmn_to_eng[csid] = esid
                    
    print("[TATOEBA] Reading English sentences...")
    eng_needed = set(cmn_to_eng.values())
    eng_map = {}
    with bz2.open(eng_path, 'rt', encoding='utf-8') as f:
        for line in f:
            parts = line.strip().split('\t')
            if len(parts) >= 3:
                sid, lang, text = parts[0], parts[1], parts[2]
                if sid in eng_needed:
                    eng_map[sid] = text
                    
    # Pair cmn and eng
    pairs = []
    for csid, esid in cmn_to_eng.items():
        if esid in eng_map:
            c_text = cmn_map[csid]
            e_text = eng_map[esid]
            pairs.append((c_text, e_text))
            
    print(f"[TATOEBA] Filtered {len(pairs)} short Chinese-English sentence pairs.")
    return pairs

def format_sentence_pinyin(chinese_text: str) -> str:
    py_list = pinyin(chinese_text, style=Style.TONE)
    res = []
    for i, item in enumerate(py_list):
        s = item[0]
        if i > 0 and s and s[0].isalnum():
            prev = py_list[i-1][0]
            if prev and prev[0].isalnum():
                res.append(' ' + s)
            else:
                res.append(s)
        else:
            res.append(s)
    return ''.join(res)

def generate_fallback_sentences(char, pinyin_str, def_str):
    # Standard natural template sentences for characters missing enough Tatoeba sentences
    patterns = [
        (f"这是{char}。", f"This is '{def_str}'."),
        (f"你喜欢{char}吗？", f"Do you like '{def_str}'?"),
        (f"{char}是什么？", f"What is '{def_str}'?"),
    ]
    results = []
    for c_text, e_text in patterns:
        chunks = jieba.lcut(c_text)
        results.append({
            "chinese": c_text,
            "pinyin": format_sentence_pinyin(c_text),
            "english": e_text,
            "chunks": chunks
        })
    return results

def main():
    print("=== HanZi XingZuo Data Pipeline ===")
    
    top1000_chars = get_subtlex_top1000()
    top1000_set = set(top1000_chars)
    
    cedict_map = get_cedict_dictionary()
    hanzi_meta = get_makemeahanzi_data()
    tatoeba_pairs = get_tatoeba_sentences(top1000_set)
    
    # Map sentences to characters
    char_to_sentences = {c: [] for c in top1000_chars}
    
    print("[PIPELINE] Assigning Tatoeba sentences to characters...")
    for c_text, e_text in tatoeba_pairs:
        # Check if sentence characters are within top 1000 or reasonable
        chars_in_sent = [c for c in c_text if '\u4e00' <= c <= '\u9fff']
        if not chars_in_sent:
            continue
        
        # Calculate coverage ratio against top 1000
        in_top_cnt = sum(1 for c in chars_in_sent if c in top1000_set)
        if in_top_cnt / len(chars_in_sent) < 0.7:
            continue # Skip sentences with too many unknown characters
            
        chunks = jieba.lcut(c_text)
        
        for c in chars_in_sent:
            if c in char_to_sentences and len(char_to_sentences[c]) < 3:
                # Avoid duplicate sentences
                if not any(s['chinese'] == c_text for s in char_to_sentences[c]):
                    char_to_sentences[c].append({
                        "chinese": c_text,
                        "pinyin": format_sentence_pinyin(c_text),
                        "english": e_text,
                        "chunks": chunks
                    })
                    
    # Generate seed JSON objects
    characters_out = []
    sentences_out = []
    sent_id_counter = 1
    
    for idx, char in enumerate(top1000_chars):
        m = hanzi_meta.get(char, {})
        ce = cedict_map.get(char, [])
        
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
            defs = [char]
            
        # Characters in deck
        characters_out.append({
            "id": char,
            "deckId": "top-1000",
            "pinyin": pinyins,
            "definitions": defs,
            "frequency": idx + 1, # 1-1000
            "components": m.get('components', []),
            "radical": m.get('radical', '')
        })
        
        # Sentences
        sents = char_to_sentences[char]
        if len(sents) < 3:
            first_def = defs[0] if defs else char
            first_py = pinyins[0] if pinyins else ''
            fallbacks = generate_fallback_sentences(char, first_py, first_def)
            for fb in fallbacks:
                if len(sents) < 3 and not any(s['chinese'] == fb['chinese'] for s in sents):
                    sents.append(fb)
                    
        for s in sents[:3]:
            sentences_out.append({
                "id": f"s-{sent_id_counter}",
                "characterId": char,
                "deckId": "top-1000",
                "chinese": s["chinese"],
                "pinyin": s.get("pinyin", format_sentence_pinyin(s["chinese"])),
                "english": s["english"],
                "chunks": s["chunks"]
            })
            sent_id_counter += 1
            
    deck_out = {
        "id": "top-1000",
        "name": "Top 1000 Characters",
        "description": "The 1,000 most frequent Chinese characters from subtitle frequency data",
        "isBuiltIn": True,
        "createdAt": 1700000000000
    }
    
    seed_data = {
        "deck": deck_out,
        "characters": characters_out,
        "sentences": sentences_out
    }
    
    output_path = os.path.join(OUTPUT_DIR, "seed-data.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(seed_data, f, ensure_ascii=False, indent=2)
        
    print("\n=== PIPELINE STATS ===")
    print(f"Output File: {output_path}")
    print(f"Total Characters: {len(characters_out)}")
    print(f"Total Sentences: {len(sentences_out)}")
    print(f"Avg Sentences per Char: {len(sentences_out)/len(characters_out):.2f}")
    print("Sample Character:", json.dumps(characters_out[0], ensure_ascii=False))
    print("Sample Sentence:", json.dumps(sentences_out[0], ensure_ascii=False))
    print("Pipeline complete successfully!")

if __name__ == "__main__":
    main()
