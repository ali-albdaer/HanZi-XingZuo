import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

url = "https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/complete.json"
r = requests.get(url)
print("Fetched complete.json, length:", len(r.content))

data = r.json()
print("Total entries:", len(data))
print("Sample entry 0:", json.dumps(data[0], ensure_ascii=False, indent=2))
print("Sample entry 100:", json.dumps(data[100], ensure_ascii=False, indent=2))
