import requests
import io
import zipfile
import sys

sys.stdout.reconfigure(encoding='utf-8')

url = "https://journals.plos.org/plosone/article/file?id=10.1371/journal.pone.0010729.s002&type=supplementary"
headers = {'User-Agent': 'Mozilla/5.0'}
r = requests.get(url, headers=headers)

z = zipfile.ZipFile(io.BytesIO(r.content))

with z.open('SUBTLEX-CH-CHR') as f:
    lines = f.read().decode('gbk').splitlines()
    print("Total lines:", len(lines))
    print("Header:", lines[2])
    for i, line in enumerate(lines[3:15]):
        print(f"Rank {i+1}:", line.split('\t'))
