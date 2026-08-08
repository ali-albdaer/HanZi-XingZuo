import requests

urls = [
    "https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz",
    "https://journals.plos.org/plosone/article/file?id=10.1371/journal.pone.0010729.s002&type=supplementary",
    "https://downloads.tatoeba.org/exports/per_language/cmn/cmn_sentences.tsv.bz2",
    "https://downloads.tatoeba.org/exports/per_language/cmn/cmn-eng_links.tsv.bz2",
    "https://downloads.tatoeba.org/exports/per_language/eng/eng_sentences.tsv.bz2",
    "https://raw.githubusercontent.com/skishore/makemeahanzi/master/dictionary.txt"
]

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
for url in urls:
    try:
        r = requests.head(url, headers=headers, allow_redirects=True, timeout=10)
        print(f"{url[:60]}... -> status {r.status_code}")
    except Exception as e:
        print(f"{url[:60]}... -> error {e}")
