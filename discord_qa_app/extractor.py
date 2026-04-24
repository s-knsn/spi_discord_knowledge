import json
import re

with open('d:/Users/Ken/Desktop/test/raw_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

text = '\n'.join(data)

# Extract URLs correctly
urls = list(set(re.findall(r'https?://[^\s<>"\'()]+', text)))

# Keywords indicating concrete knowledge, numbers, tools, or prices
keywords = ['円', '回', '文字', '字', '人', '件', 'Canva', 'キャンバ', 'iメイト', 'Lステップ', 'Lステ', 'エルメ', 'エルグラム', 'STORES', 'ストア', 'LINE', 'ライン', '匿名', 'ヤマト', 'PDF', 'ChatGPT', 'GPT', 'プロンプト', '画像', '自動', '時間']

interestingLines = set()

for item in data:
    lines = item.split('\n')
    for line in lines:
        line = line.strip()
        # ignore generic discord UI elements
        if not line or line.startswith('@') or line.startswith('http') or line in ['リアクションを付ける', 'クリックしてリアクション', '返信', '転送', 'その他', ':thumbsup:', ':100:', ':laughing:', 'メッセージが読み込めませんでした']:
            continue
        
        # skip normal timestamp/date strings
        if re.match(r'^\d+$', line) or re.match(r'^\d{4}年\d{1,2}月\d{1,2}日.*$', line):
            continue
            
        # check keywords and reasonable length
        if len(line) > 10 and any(kw in line for kw in keywords):
            interestingLines.add(line)

with open('d:/Users/Ken/Desktop/test/extracted_info.txt', 'w', encoding='utf-8') as f:
    f.write("URLs:\n")
    f.write('\n'.join(urls))
    f.write("\n\nLines:\n")
    f.write('\n'.join(interestingLines))
