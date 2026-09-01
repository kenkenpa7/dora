# 🎮 ドラゴンクエスト風 レトロRPG (GitHub Pages版 v1.1.0)

スマートフォン・PC両対応のドラクエ1風レトロRPGプロトタイプです。
PWA（Progressive Web Apps）および Web Audio API による**完全オフライン動作**に対応し、GitHub Pages経由で全世界に公開されています。

---

## 🌐 1. 公開URL・基本情報

* **ゲーム公開URL**: **`https://kenkenpa7.github.io/dora/`**
* **モンスター図鑑・編集ツール**: **`https://kenkenpa7.github.io/dora/monster_viewer.html`**
* **GitHubリポジトリ**: `https://github.com/kenkenpa7/dora`
* **ホスティング環境**: GitHub Pages (`main` ブランチ / `/(root)` 配信)
* **ローカル作業フォルダ**: `c:\Users\beach\Desktop\大元\ゲーム\dora(ドラクエGit）`

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
3. **完全オフライン動作**:
   * 初回起動時にService Worker（`sw.js`）がゲーム本体および全11音源を端末内にキャッシュします。
   * スマホを機内モード（電波オフ）にしても、通常通りBGM・効果音付きで起動・プレイ可能です。

---

## 📁 3. ファイル・ディレクトリ構成

```text
ゲーム/dora/
├── index.html                     # ゲーム本体HTML（PWAタグ・ServiceWorker登録・Ver 1.1.0）
├── monster_viewer.html            # モンスター確認・パラメータ調整ビューア
├── manifest.json                  # Web App Manifest（スタンドアロンPWA設定）
├── sw.js                          # Service Worker（Cache First / 完全オフラインエンジン）
├── README.md                      # 本書（管理・更新マニュアル）
├── AGENTS.md                      # doraプロジェクト専用AI行動ルール
├── バージョン履歴.md               # Gitコミット連動・自動生成変更履歴
├── プロジェクト開発全記録_引継ぎ書.md # 開発全記録・トラブル解決引継ぎ書
├── css/
│   └── style.css                  # スタイルシート（スマホノッチ対応・全画面100dvh）
├── js/
│   ├── audio.js                   # Web Audio API 音声エンジン (fetch+decodeAudioData)
│   ├── battle.js                  # コマンドバトル処理
│   ├── data.js                    # マップデータ・モンスターデータ・呪文・アイテム定義
│   ├── graphics.js                # Canvas描画（2コマピコピコアニメーション搭載）
│   └── main.js                    # メインゲームループ・入力ハンドラ・シーン管理
├── bgm/                           # 全11音源（MP3 8曲 / WAV 3種）
│   ├── opening.mp3, castle.mp3, town.mp3, field.mp3, dungeon.mp3
│   ├── battle.mp3, boss.mp3, ending.mp3
│   └── encounter.wav, inn.wav, victory.wav
└── icons/                         # PWAアプリアイコン (192x192, 512x512, apple-touch-icon)
```

---

## 🚀 4. 更新・修正時の安全なGit運用手順

コードや画像を修正した場合、以下のルールに従ってGit更新を行います：

1. **`AGENTS.md` のルール遵守**:
   * コマンド実行前に必ず「更新前バージョン ➡ 更新後バージョン」を明示すること。
   * `index.html`、`js/main.js`、`sw.js` のバージョン番号・キャッシュ名を同期して繰り上げること。
2. **安全なステージング**:
   * `git add .` の一括指定は禁止。変更したファイルだけを個別に指定すること。
3. **コミット ＆ Push**:
   ```powershell
   git add index.html js/main.js sw.js ...
   git commit -m "feat: ○○機能の追加 (v1.1.x)"
   git push origin main
   ```
4. **自動生成ドキュメントの反映**:
   * コミット完了後、自動更新された `バージョン履歴.md` をコミット＆Pushする。

---
*最終更新日: 2026年9月2日 (v1.1.0)*
