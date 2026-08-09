import json, re, os, sys
sys.stdout.reconfigure(encoding="utf-8")
SEED_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "app", "public", "seed-data.json")
CHINESE_RE = re.compile(r"[\u4e00-\u9fff]")
ARABIC_NUM_RE = re.compile(r"[0-9]")
FALLBACK_EN = [
    "I learned this character",
    "Please look at this character",
    "is very common",
    "This is '",
    "Do you like '",
    "What is '",
]

def is_fallback(en, zh):
    return any(p in en or p in zh for p in FALLBACK_EN)

def count_py(py):
    return len([t for t in py.split() if re.search(r"[a-z]", t, re.I)])

def main():
    print(f"Loading {SEED_PATH} ...")
    with open(SEED_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    chars, sentences = data["characters"], data["sentences"]
    print(f"Characters: {len(chars)}  Sentences: {len(sentences)}")

    sbm = {}
    for s in sentences:
        sbm.setdefault(s["characterId"], []).append(s)

    errs, warns = [], []
    st = dict(
        def_chinese=0, def_long=0, def_empty=0, def_raw=0,
        sent_no_tgt=0, sent_py=0, sent_num=0, sent_chunk=0,
        sent_noeng=0, sent_fb=0, cov_none=0, cov_few=0,
    )

    for c in chars:
        cid, defs = c["id"], c.get("definitions", [])
        if not defs:
            errs.append(f"DEF-EMPTY {cid}"); st["def_empty"] += 1; continue
        for d in defs:
            if CHINESE_RE.search(d):
                warns.append(f"DEF-CHN {cid}: {d[:60]!r}"); st["def_chinese"] += 1
            if len(d) > 80:
                warns.append(f"DEF-LONG {cid}: len={len(d)}"); st["def_long"] += 1
            if d.strip() == cid:
                errs.append(f"DEF-RAW {cid}"); st["def_raw"] += 1

    for s in sentences:
        sid, cid = s["id"], s["characterId"]
        zh = s.get("chinese", "")
        py = s.get("pinyin", "")
        en = s.get("english", "")
        ck = s.get("chunks", [])
        if not en:
            errs.append(f"NO-ENG {sid}"); st["sent_noeng"] += 1
        if cid not in zh:
            errs.append(f"NO-TGT {sid}: {cid!r} not in {zh!r}"); st["sent_no_tgt"] += 1
        if ARABIC_NUM_RE.search(zh):
            warns.append(f"ARABIC {sid} ({cid}): {zh!r}"); st["sent_num"] += 1
        hc = len(CHINESE_RE.findall(zh))
        pc = count_py(py)
        if hc > 0 and abs(pc - hc) > 1:
            warns.append(f"PY-MISMATCH {sid}: hz={hc} py={pc} {zh!r}"); st["sent_py"] += 1
        if "".join(ck) != zh:
            warns.append(f"CHUNK {sid} ({cid})"); st["sent_chunk"] += 1
        if is_fallback(en, zh):
            warns.append(f"FALLBACK {sid} ({cid}): {en!r}"); st["sent_fb"] += 1

    for c in chars:
        cid = c["id"]
        sl = sbm.get(cid, [])
        if not sl:
            errs.append(f"NO-SENTS {cid}"); st["cov_none"] += 1
        elif len(sl) < 3:
            warns.append(f"FEW-SENTS {cid}: {len(sl)}"); st["cov_few"] += 1

    print("\n==== QUALITY REPORT ====")
    for k, v in st.items():
        print(f"  {k:<26}: {v}")
    print(f"\n  ERRORS (critical) : {len(errs)}")
    print(f"  WARNINGS          : {len(warns)}")
    if errs:
        print("\n-- ERRORS --")
        for e in errs[:40]: print(f"  {e}")
        if len(errs) > 40: print(f"  ...+{len(errs)-40} more")
    if warns:
        print("\n-- WARNINGS (first 30) --")
        for w in warns[:30]: print(f"  {w}")
        if len(warns) > 30: print(f"  ...+{len(warns)-30} more")
    crit = st["def_empty"] + st["def_raw"] + st["sent_no_tgt"] + st["sent_noeng"] + st["cov_none"]
    print()
    if crit == 0:
        print("RESULT: PASS - no critical issues.")
        sys.exit(0)
    else:
        print(f"RESULT: FAIL - {len(errs)} critical error(s).")
        sys.exit(1)

if __name__ == "__main__":
    main()
