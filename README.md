# 🎮 ドラゴンクエスト風 レトロRPG (GitHub Pages版)

スマートフォン・PC両対応のドラクエ1風レトロRPGプロトタイプです。
PWA（Progressive Web Apps）および完全オフライン動作に対応し、GitHub Pages経由で全世界に公開されています。

---

## 🌐 1. 公開URL・基本情報

* **ゲーム公開URL**: **`https://kenkenpa7.github.io/dora/`**
* **モンスター図鑑・編集ツール**: **`https://kenkenpa7.github.io/dora/monster_viewer.html`**
* **GitHubリポジトリ**: `https://github.com/kenkenpa7/dora`
* **ホスティング環境**: GitHub Pages (`main` ブランチ / `/(root)` 配信)
* **ローカル作業フォルダ**: `c:\Users\beach\Desktop\大元\ゲーム\dora`

---

## 📱 2. スマホ利用・PWAインストール方法

1. **iPhone (Safari)**:
   * `https://kenkenpa7.github.io/dora/` にアクセス
   * 下部メニューの「共有」アイコン（四角から上矢印）をタップ
   * **「ホーム画面に追加」** を選択
2. **Android (Chrome)**:
   * `https://kenkenpa7.github.io/dora/` にアクセス
   * 右上の「︙」メニューをタップ
   * **「アプリをインストール」** または **「ホーム画面に追加」** を選択
3. **オフライン動作**:
   * 初回起動時にService Worker（`sw.js`）が全音源・スクリプト・画像をキャッシュします。
   * スマホを機内モード（電波オフ）にしても、通常通りBGM付きで起動・プレイ可能です。

---

## 📁 3. ファイル・ディレクトリ構成

```text
ゲーム/dora/
├── index.html                     # ゲーム本体HTML（PWAタグ・ServiceWorker登録）
├── monster_viewer.html            # モンスター確認・パラメータ調整ビューア
├── manifest.json                  # Web App Manifest（アプリ名・アイコン・画面向き）
├── sw.js                          # Service Worker（Cache First / 完全オフラインエンジン）
├── README.md                      # 本書（管理・更新マニュアル）
├── css/
│   └── style.css                  # スタイルシート（スマホ縦画面・ノッチセーフエリア対応）
├── js/
│   ├── audio.js                   # Web Audio / BGM・SE再生ロジック
│   ├── battle.js                  # コマンドバトル処理
│   ├── data.js                    # マップデータ・モンスターデータ・呪文・アイテム定義
│   ├── graphics.js                # Canvas描画（マップ・キャラ・モンスター）
│   └── main.js                    # メインゲームループ・入力ハンドラ・シーン管理
├── bgm/                           # 全11曲の音源ファイル（MP3/WAV）
│   ├── opening.mp3, castle.mp3, town.mp3, field.mp3, dungeon.mp3
│   ├── battle.mp3, boss.mp3, ending.mp3
│   └── encounter.wav, inn.wav, victory.wav
├── icons/                         # PWAアプリアイコン
│   ├── icon-192.png               # Android / PWA標準アイコン (192x192)
│   ├── icon-512.png               # 高解像度・スプラッシュ用 (512x512)
│   └── apple-touch-icon.png       # iOS Safari用 (180x180)
└── プロジェクト開発全記録_引継ぎ書.md
```

---

## 🚀 4. 更新・修正時の作業手順（GitHubデプロイルート）

コードや画像を修正した場合、以下の手順でGitHubへPushすることで、**数十秒〜1分ほどでGitHub Pages上のゲームへ自動反映**されます。

### ターミナル（PowerShell）での実行手順

```powershell
# 1. dora フォルダへ移動
cd c:\Users\beach\Desktop\大元\ゲーム\dora

# 2. 変更内容を確認
git status

# 3. 変更をステージング
git add .

# 4. コミット（修正内容をメモ）
git commit -m "update: モンスターデータの調整とUI改善"

# 5. GitHubへプッシュ（自動デプロイ開始）
git push origin main
```

---

## ⚠️ 5. 今後の改修時の注意点（PWA・パス設定ルール）

1. **パス指定はすべて `/dora/` または相対パスにすること**:
   * GitHub Pages はドメイン直下ではなく `/dora/` のサブパスで配信されます。
   * 新しいファイルや音源を追加した場合は、以下の2ファイルにもパスを追記してください：
     * `manifest.json`: アイコンや起動URL
     * `sw.js`: `ASSETS_TO_CACHE` 配列への追加 ＆ `CACHE_NAME` のバージョンアップ（例: `dora-gh-pages-v2`）
2. **キャッシュ更新**:
   * JSやCSSを大幅に変更した際は、`sw.js` 内の `CACHE_NAME` を `v1` ➡ `v2` ➡ `v3` とカウントアップすることで、既存プレイヤーのスマホキャッシュが安全に最新化されます。

---
*最終更新日: 2026年8月21日*
