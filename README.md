# Image Viewer

ローカル・サーバーどちらでも動く画像ビューア。Docker で起動します。

## 起動方法

```bash
docker compose up -d
```

ブラウザで http://localhost:3000 にアクセス。

## データの保存先

DB・画像ファイルはすべてコンテナ外のフォルダ1つで管理されます。

```
data/               ← デフォルトの保存先（docker-compose.yml で変更可）
  image-viewer.db
  originals/
  webp/
  thumbnails/
```

保存先を変えたい場合は `docker-compose.yml` の1行を編集するだけで、**再ビルド不要**です。

```yaml
volumes:
  - ./data:/data               # デフォルト（プロジェクト直下の data フォルダ）
  - ./storage:/data            # 既存の storage フォルダをそのまま使う場合
  - /mnt/nas/image-viewer:/data  # NASや別ドライブに置く場合
```

## アップデート

```bash
git pull
docker compose up -d --build
```

DB のマイグレーションは起動時に自動で実行されます。

## ポート変更

デフォルトは 3000 番ポートです。変更する場合は `docker-compose.yml` を編集:

```yaml
ports:
  - "8080:3000"  # ホスト側のポートを変更
```

## 開発

Docker を使わずローカルで動かす場合:

```bash
npm install
# .env.local に STORAGE_PATH を設定
echo "STORAGE_PATH=$(pwd)/storage" > .env.local
npm run dev
```
