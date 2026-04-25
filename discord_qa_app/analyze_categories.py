import json
from collections import Counter

with open('web_app/src/data/qa_pairs.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

cats = Counter(qa.get('category', '未分類') for qa in data)

# 大カテゴリのタイトル例
big_cats = ['ツール設定', '集客', '鑑定手法']
for cat in big_cats:
    items = [qa for qa in data if qa.get('category') == cat]
    print(f"\n=== {cat} ({len(items)}件) タイトル例 ===")
    for qa in items[:8]:
        tags_str = ", ".join(qa.get('tags', [])[:3])
        title = qa["title"][:60]
        print(f"  [{tags_str}] {title}")

# 類似カテゴリグループ分析
print("\n\n=== 類似カテゴリグループ ===")
groups = {
    "販売系": ['販売戦略', '販売', 'セールス', '販売・セールス', '営業', '営業戦略', '商品販売', '商品設計', '商品提供', '商品開発', '販売・決済'],
    "運用系": ['運用', '運用戦略', '運用・集客', '運用効率', '運用ルール', '運用ノウハウ', '運用フロー', 'アカウント運用', 'アカウント設定', 'アカウント戦略', 'アカウント設計', 'アカウント管理'],
    "効率化系": ['業務効率化', 'オペレーション', '外注', '外注化', '外注・効率化', '効率化', 'AI活用'],
    "ビジネス系": ['ビジネスモデル', 'ビジネス', 'ビジネス運営', 'ビジネス戦略', '事業拡大', '事業戦略', '収益化', 'マネタイズ'],
}
for group_name, members in groups.items():
    total = sum(cats.get(m, 0) for m in members)
    detail = ", ".join(f"{m}({cats.get(m,0)})" for m in members if cats.get(m, 0) > 0)
    print(f"  {group_name}: 合計{total}件 -> {detail}")

# ツール設定の内訳をタグで分析
print("\n\n=== ツール設定(442件)のタグ内訳 ===")
tool_items = [qa for qa in data if qa.get('category') == 'ツール設定']
tool_tags = Counter()
for qa in tool_items:
    for t in qa.get('tags', []):
        tool_tags[t] += 1
for tag, count in tool_tags.most_common(15):
    print(f"  {count:>4}件  #{tag}")

# 集客の内訳をタグで分析
print("\n\n=== 集客(424件)のタグ内訳 ===")
shukyaku_items = [qa for qa in data if qa.get('category') == '集客']
shukyaku_tags = Counter()
for qa in shukyaku_items:
    for t in qa.get('tags', []):
        shukyaku_tags[t] += 1
for tag, count in shukyaku_tags.most_common(15):
    print(f"  {count:>4}件  #{tag}")
