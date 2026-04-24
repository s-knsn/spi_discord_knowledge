import os
import sys
import json
import time
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

def extract_qa():
    sys.stdout.reconfigure(encoding='utf-8')
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("エラー: .env に GEMINI_API_KEY が設定されていません。")
        return
        
    input_file = "raw_data.json"
    output_file = os.path.join("web_app", "src", "data", "qa_pairs.json")
    
    if not os.path.exists(input_file):
        print(f"エラー: {input_file} が見つかりません。")
        return

    with open(input_file, "r", encoding="utf-8") as f:
        messages = json.load(f)
        
    if not messages:
        print("メッセージがありませんでした。")
        return

    print(f"全 {len(messages)} 件のメッセージからQ&A(ハイブリッド設計)の抽出を開始します...")
    
    client = genai.Client(api_key=api_key)
    
    prompt_template = """
あなたはコミュニティのナレッジを整理する優秀なアシスタントです。
以下のテキストデータは、Discordの占い・スピリチュアルビジネスコミュニティの生のチャット履歴から抽出したテキストの配列です。
文脈を読み解き、一連の「質問とそれに続く回答のやり取り」を見つけ出してください。

【重要な抽出ルール（ハイブリッド設計）】
今回は、パッと見てわかりやすい「綺麗な要約Q&A」と、細かなニュアンスを残す「生のやり取りスレッド」の両方を作成します。

1. `clean_qa`: 一連のやり取りを理解し、辞書のように誰が読んでもわかりやすい「質問（question）」と「回答（answer）」の文章に綺麗に整形・要約して作成してください。
2. `raw_thread`: 同時に、まとめの根拠となった「実際の会話のラリー」を時系列順に格納してください。ここは**絶対に要約せず、会話に登場する一言一句をそのままの生テキスト**として記録してください。

【その他の抽出ルール】
1. 単なる独り言、挨拶、返信のない質問などは無視してください。
2. 以下のJSONスキーマの配列形式で出力してください。Markdownのコードブロックは含めず、純粋なJSON文字列のみを出力してください。

[
  {
    "title": "スレッドの概要がわかる短い要約タイトル",
    "category": "カテゴリ名（例：集客、鑑定手法、ツール設定、マインドなど）",
    "tags": ["タグ1", "タグ2"],
    "clean_qa": {
      "question": "一連の質問をわかりやすく美しく整形・要約した文章",
      "answer": "一連の回答をわかりやすく美しく整形・要約し、ノウハウとして読めるようにした文章"
    },
    "raw_thread": [
      {
        "speaker": "質問者や回答者の名前",
        "text": "元の発言の一言一句そのままの生テキスト（絶対に要約・改変しないこと！）"
      },
      ...
    ]
  }
]

【チャット履歴データ】
{raw_text}
"""

    all_pairs = []
    
    if os.path.exists(output_file):
        try:
            with open(output_file, "r", encoding="utf-8") as f:
                all_pairs = json.load(f)
            print(f"既存のファイルから {len(all_pairs)} 件のQ&Aを読み込みました。続きから処理します。")
        except json.JSONDecodeError:
            print("既存のファイルの読み込みに失敗しました。上書きします。")

    batch_size = 150
    start_idx = 1950
    max_batches = 100
    
    for i in range(start_idx, min(len(messages), start_idx + batch_size * max_batches), batch_size):
        batch = messages[i:i + batch_size]
        print(f"\n--- バッチ処理中: {i + 1} 〜 {min(i + batch_size, len(messages))} 件目 ---")
        
        raw_text = "\n\n---\n\n".join(batch)
        prompt = prompt_template.replace("{raw_text}", raw_text)
        
        max_retries = 5
        for attempt in range(max_retries):
            try:
                response = client.models.generate_content(
                    # model='gemini-2.5-flash',
                    model='gemini-2.5-pro',
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                    ),
                )
                
                try:
                    result_json = json.loads(response.text)
                    if isinstance(result_json, list):
                        all_pairs.extend(result_json)
                        
                        with open(output_file, "w", encoding="utf-8") as f:
                            json.dump(all_pairs, f, ensure_ascii=False, indent=2)
                            
                        print(f"抽出成功！ このバッチから {len(result_json)} 件、累計 {len(all_pairs)} 件抽出しました。")
                    break
                    
                except json.JSONDecodeError:
                    print("エラー: Geminiの出力が正しいJSON形式ではありませんでした。")
                    break
                    
            except Exception as e:
                print(f"API実行エラー (試行 {attempt + 1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(30)
                else:
                    print("最大再試行回数に達しました。")
        
        time.sleep(15)

    print(f"\n完了！ 最終的に計 {len(all_pairs)} 件のQ&Aスレッドを {output_file} に保存しました。")

if __name__ == "__main__":
    extract_qa()
