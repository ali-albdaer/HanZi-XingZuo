import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('packages/app/public/seed-data.json', 'r', encoding='utf-8') as f:
    seed = json.load(f)

print(f"Total characters in seed-data.json: {len(seed['characters'])}")

# Check for suspicious patterns in current definitions
suspicious_patterns = ['used in', 'variant of', 'surname', 'see ', 'classifier for', 'CL:']
flagged = []

for c in seed['characters']:
    defs_str = ' '.join(c['definitions'])
    for pat in suspicious_patterns:
        if pat.lower() in defs_str.lower():
            flagged.append((c['id'], c['pinyin'], c['definitions']))
            break

print(f"Total flagged characters with reference noise: {len(flagged)}")
print("Sample 15 flagged characters:")
for item in flagged[:15]:
    print(f"  {item[0]} [{', '.join(item[1])}]: {item[2]}")
