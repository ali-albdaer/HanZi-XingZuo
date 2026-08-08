import sys
from pypinyin import pinyin, Style

sys.stdout.reconfigure(encoding='utf-8')

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

print(format_sentence_pinyin("我该去睡觉了。"))
print(format_sentence_pinyin("你好吗？我很高兴认识你！"))
