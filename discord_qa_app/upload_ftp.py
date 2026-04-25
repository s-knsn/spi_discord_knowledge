import os
import ftplib
from dotenv import load_dotenv

def upload_dir_to_ftp(ftp, local_dir, remote_dir):
    """ローカルディレクトリをFTPサーバーに再帰的にアップロードする"""
    print(f"ディレクトリ作成/移動: {remote_dir}")
    try:
        ftp.cwd(remote_dir)
    except ftplib.error_perm:
        try:
            ftp.mkd(remote_dir)
            ftp.cwd(remote_dir)
        except Exception as e:
            print(f"ディレクトリの作成に失敗しました {remote_dir}: {e}")
            return

    for item in os.listdir(local_dir):
        local_path = os.path.join(local_dir, item)
        if os.path.isfile(local_path):
            print(f"アップロード中: {item}")
            with open(local_path, 'rb') as f:
                ftp.storbinary(f'STOR {item}', f)
        elif os.path.isdir(local_path):
            upload_dir_to_ftp(ftp, local_path, item)
            ftp.cwd('..') # 親ディレクトリに戻る

def main():
    load_dotenv()
    
    # .envからFTP情報を取得
    host = os.environ.get('FTP_HOST')
    user = os.environ.get('FTP_USER')
    passwd = os.environ.get('FTP_PASS')
    target_dir = os.environ.get('FTP_DIR')
    
    if not all([host, user, passwd, target_dir]):
        print("エラー: .env ファイルに FTP_HOST, FTP_USER, FTP_PASS, FTP_DIR が正しく設定されていません。")
        return

    local_dist_path = os.path.join('web_app', 'dist')
    
    if not os.path.exists(local_dist_path):
        print(f"エラー: {local_dist_path} フォルダが見つかりません。先に npm run build を実行してください。")
        return

    print(f"FTPサーバー ({host}) に接続しています...")
    try:
        with ftplib.FTP() as ftp:
            ftp.connect(host, 21, timeout=30)
            ftp.login(user, passwd)
            
            print("接続成功！アップロードを開始します...")
            # ルートディレクトリからターゲットディレクトリへ移動
            try:
                ftp.cwd(target_dir)
            except ftplib.error_perm:
                print(f"エラー: サーバー上に {target_dir} というディレクトリが見つかりません。パスが正しいか確認してください。（例: yourdomain.com/public_html）")
                return
                
            # distフォルダの中身をすべてアップロード
            for item in os.listdir(local_dist_path):
                local_path = os.path.join(local_dist_path, item)
                if os.path.isfile(local_path):
                    print(f"アップロード中: {item}")
                    with open(local_path, 'rb') as f:
                        ftp.storbinary(f'STOR {item}', f)
                elif os.path.isdir(local_path):
                    upload_dir_to_ftp(ftp, local_path, item)
                    ftp.cwd(f'/{target_dir}') # 確実に戻るため絶対パス的な処理を考慮
                    
            print("\n★★★ アップロードが完了しました！ ★★★")
            
    except Exception as e:
        print(f"FTP通信エラーが発生しました: {e}")

if __name__ == "__main__":
    main()
