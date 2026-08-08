import re

PYSPEC = {
    'a': ['ā', 'á', 'ǎ', 'à', 'a'],
    'e': ['ē', 'é', 'ě', 'è', 'e'],
    'i': ['ī', 'í', 'ǐ', 'ì', 'i'],
    'o': ['ō', 'ó', 'ǒ', 'ò', 'o'],
    'u': ['ū', 'ú', 'ǔ', 'ù', 'u'],
    'v': ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
    'u:': ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
    'ü': ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
}

def convert_syllable(syllable: str) -> str:
    match = re.match(r'^([a-zA-ZüÜvV:]+)([1-5])?$', syllable)
    if not match:
        return syllable
    
    letters, tone_str = match.groups()
    if not tone_str or tone_str == '5':
        return letters.replace('u:', 'ü').replace('v', 'ü')
    
    tone = int(tone_str) - 1 # 0-indexed for 1-4
    s = letters.replace('u:', 'ü').replace('v', 'ü')
    lower_s = s.lower()

    # Rule for placing tone mark:
    # 1. 'a' or 'e' gets the tone mark
    # 2. 'ou' gets mark on 'o'
    # 3. otherwise the last vowel gets tone mark
    target_idx = -1
    if 'a' in lower_s:
        target_idx = lower_s.find('a')
    elif 'e' in lower_s:
        target_idx = lower_s.find('e')
    elif 'ou' in lower_s:
        target_idx = lower_s.find('o')
    else:
        vowels = [i for i, c in enumerate(lower_s) if c in 'iouü']
        if vowels:
            target_idx = vowels[-1]

    if target_idx != -1:
        char = lower_s[target_idx]
        if char in PYSPEC and tone < 4:
            replacement = PYSPEC[char][tone]
            if s[target_idx].isupper():
                replacement = replacement.upper()
            s = s[:target_idx] + replacement + s[target_idx+1:]

    return s

def convert_pinyin_str(pinyin_raw: str) -> str:
    parts = pinyin_raw.strip().split()
    return ' '.join(convert_syllable(p) for p in parts)
