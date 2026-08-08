import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

url = "https://raw.githubusercontent.com/skishore/makemeahanzi/master/dictionary.txt"
resp = requests.get(url, stream=True)

count = 0
for line in resp.iter_lines():
    if line:
        data = json.loads(line.decode('utf-8'))
        if count < 3:
            print(json.dumps(data, ensure_ascii=False, indent=2))
        count += 1

print(f"Total entries: {count}")
