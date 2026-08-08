import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('packages/app/public/seed-data.json', 'r', encoding='utf-8') as f:
    seed = json.load(f)

top1000_set = set(c['id'] for c in seed['characters'])
sentences = seed['sentences']

perfect_count = 0
high_count = 0 # >= 90%
low_count = 0  # < 90%

low_examples = []

for s in sentences:
    chinese = s['chinese']
    c_chars = [c for c in chinese if '\u4e00' <= c <= '\u9fff']
    if not c_chars:
        continue
    in_top = sum(1 for c in c_chars if c in top1000_set)
    ratio = in_top / len(c_chars)
    if ratio == 1.0:
        perfect_count += 1
    elif ratio >= 0.85:
        high_count += 1
    else:
        low_count += 1
        out_chars = [c for c in c_chars if c not in top1000_set]
        low_examples.append((s['characterId'], chinese, s['english'], out_chars, ratio))

print(f"Total sentences: {len(sentences)}")
print(f"100% strictly within top 1000: {perfect_count} ({perfect_count/len(sentences)*100:.1f}%)")
print(f"85-99% within top 1000: {high_count} ({high_count/len(sentences)*100:.1f}%)")
print(f"< 85% within top 1000: {low_count} ({low_count/len(sentences)*100:.1f}%)")

if low_examples:
    print("\nSample low coverage sentences:")
    for ex in low_examples[:10]:
        print(f"  Target '{ex[0]}': {ex[1]} ({ex[2]}) | Outside chars: {ex[3]} | Ratio: {ex[4]*100:.0f}%")
