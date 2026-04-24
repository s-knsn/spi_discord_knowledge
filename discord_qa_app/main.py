import extractor
# import analyzer # 本日は使用しないためコメントアウト

def main():
    print("="*60)
    print("Discordメッセージ 半自動 全件抽出システム")
    print("="*60)
    
    # ステップ1: Discordからデータの抽出
    try:
        print(f"\n[ステップ1] Discord画面からのメッセージテキスト抽出を開始します。")
        extractor.extract_messages()
    except Exception as e:
        print(f"\n[エラー] 抽出処理中に問題が発生しました: {e}")
        return
        
    print("\n------------------------------------------------------------\n")
    
    # ステップ2: Geminiによる分析と分類
    print("[ステップ2] 本日は「すべての情報を抜き出す」ことが目的のため、AIによる自動分類はスキップします。")
    print("すべてのデータは `raw_data.json` に上から古い順(時系列)で保存されています。")
    # try:
    #     analyzer.analyze_and_categorize()
    # except Exception as e:
    #     ...
        
    print("\n="*60)
    print("抽出タスクが完了しました！")
    print("システムフォルダ内にある『raw_data.json』を開き、内容を確認してください。")
    print("="*60)

if __name__ == "__main__":
    main()
