import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

chars = ['上', '万', '我', '的', '你', '是', '了', '不', '看', '做']

with open('packages/data-scripts/data/makemeahanzi.txt', 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        c = data.get('character')
        if c in chars:
            print(f"Char: {c}")
            print(f"  MakeMeAHanzi Def: {data.get('definition')}")
            print(f"  MakeMeAHanzi Pinyin: {data.get('pinyin')}")
