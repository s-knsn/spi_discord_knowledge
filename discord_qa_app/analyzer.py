import os
import json
import datetime
from google import genai
from google.genai import types
from dotenv import load_dotenv

# .envファイルからAPIキーを読み込む
load_dotenv()

def analyze_and_categorize():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("エラー: .env に GEMINI_API_KEY が設定されていません。")
        return
        
    if not os.path.exists("raw_data.json"):
        print("エラー: raw_data.json が見つかりません。先に抽出を行ってください。")
        return

    with open("raw_data.json", "r", encoding="utf-8") as f:
        messages = json.load(f)
        
    if not messages:
        print("抽出されたメッセージがありません。")
        return

    print(f"全 {len(messages)} 件のメッセージを処理します。")
    print("Gemini APIの制限を避けるため、15件ずつ分割してAPIに送信します...")
    client = genai.Client(api_key=api_key)
    
    output_dir = "output"
    os.makedirs(output_dir, exist_ok=True)
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    import time
    batch_size = 15
    for i in range(0, len(messages), batch_size):
        batch = messages[i:i + batch_size]
        print(f"\n--- バッチ処理中: {i + 1} 〜 {min(i + batch_size, len(messages))} 件目 ---")
        
        raw_text = "\n\n---\n\n".join(batch)
        
        prompt = """
あなたはビジネスコミュニティのモデレーターです。
以下のテキストデータは、Discordの生のチャット履歴から抽出したテキストです。
これらの文脈を読み解き、内容を以下の4つの占い・スピリチュアルビジネス特化カテゴリに分類・要約して整理してください。

【カテゴリ】
1. 集客・アカウント・コンセプト設計 (attraction)
2. 鑑定文・無料鑑定・顧客対応 (appraisal)
3. アップセル・販売・決済システム (upsell)
4. トラブル相談・マインド・その他 (others)

各カテゴリについて、「誰が何を相談（発言）し、誰がどのように答えたか（結論はどうなったか）」が明確に分かるように整理し、
カテゴリ毎のMarkdown形式の文章を作成してください。
該当するメッセージの一部にしか該当しないものや、該当がないカテゴリは柔軟に分類（または空文字列）して構いません。

以下の形式を持つ、厳密なJSONオブジェクト文字列として出力してください。

{
  "attraction": "## 集客・アカウント・コンセプト設計\\n\\n- **ユーザーA**からの相談：...\\n  - **ユーザーB**の回答：...",
  "appraisal": "## 鑑定文・無料鑑定・顧客対応\\n\\n...",
  "upsell": "## アップセル・販売・決済システム\\n\\n...",
  "others": "## トラブル相談・マインド・その他\\n\\n..."
}

【チャット履歴データ】
""" + raw_text

        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                ),
            )
            
            try:
                result_json = json.loads(response.text)
            except json.JSONDecodeError:
                print("エラー: Geminiの出力が正しいJSON形式ではありませんでした。")
                print("実際の出力内容:", response.text)
                continue

            for category, markdown_content in result_json.items():
                if markdown_content and markdown_content.strip():
                    file_path = os.path.join(output_dir, f"{category}.md")
                    with open(file_path, "a", encoding="utf-8") as f:
                        f.write(f"\n\n---\n### 追加日時: {now_str} (Batch {i//batch_size + 1})\n\n")
                        f.write(markdown_content)
            
            print(f"-> カテゴリ分類を追記しました。")
            if i + batch_size < len(messages):
                print("API制限を回避するため、約15秒待機します...")
                time.sleep(15)
                
        except Exception as e:
            print(f"Gemini APIの実行中にエラーが発生しました: {e}")
            print("再発する場合は無料枠の回数（15回/分）または1日の上限を超えている可能性があります。")

if __name__ == "__main__":
    analyze_and_categorize()
