# 🎮 ドラゴンクエスト風 レトロRPG (GitHub Pages版 v1.1.3)

スマートフォン・PC両対応のドラクエ1風レトロRPGプロトタイプです。
PWA（Progressive Web Apps）および Web Audio API による**完全オフライン動作**に対応し、ゲーム全体でわずか約1.24MBの超軽量設計となっています。

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
ゲーム/dora(ドラクエGit）/
├── index.html                     # ゲーム本体HTML（PWAタグ・ServiceWorker登録・Ver 1.1.3）
├── monster_viewer.html            # モンスター確認・パラメータ調整ビューア
├── manifest.json                  # Web App Manifest（スタンドアロンPWA設定）
├── sw.js                          # Service Worker（Cache First / 完全オフラインエンジン）
├── README.md                      # 本書（管理・更新マニュアル）
├── AGENTS.md                      # doraプロジェクト専用AI行動ルール（音源規格等）
├── バージョン履歴.md               # Gitコミット連動・自動生成変更履歴
├── プロジェクト開発全記録_引継ぎ書.md # 開発全記録・トラブル解決引継ぎ書
├── compress_bgm.py                # 公式音源標準圧縮スクリプト（32kbps mono 自動変換）
├── update_changelog.py            # バージョン履歴自動生成スクリプト
├── css/
│   └── style.css                  # スタイルシート（スマホノッチ対応・全画面100dvh）
├── js/
│   ├── audio.js                   # Web Audio API 音声エンジン (fetch+decodeAudioData)
│   ├── battle.js                  # コマンドバトル処理
│   ├── data.js                    # マップデータ・モンスターデータ・呪文・アイテム定義
│   ├── graphics.js                # Canvas描画（2コマピコピコアニメーション搭載）
│   └── main.js                    # メインゲームループ・入力ハンドラ・シーン管理
├── bgm/                           # 全11音源（mono 32kbps / 11kHz 極限圧縮版 / 合計1.00MB）
│   ├── opening.mp3, castle.mp3, town.mp3, field.mp3, dungeon.mp3
│   ├── battle.mp3, boss.mp3, ending.mp3
│   └── encounter.wav, inn.wav, victory.wav
├── BGM元サイズ/                   # オリジナル最高音質音源（バックアップ / Git追跡外）
└── icons/                         # PWAアプリアイコン (192x192, 512x512, apple-touch-icon)
```

---

## 🎵 4. 音源（BGM/SE）の標準圧縮規格 ＆ 追加・変更ルール（デフォルト設定）

本プロジェクトでは、全音源合計1.00MB（ゲーム全体1.24MB）を維持するため、**以下の規格をデフォルト設定として厳守**します。

* **音源標準圧縮規格**:
  - **BGM (MP3)**: **モノラル（1ch） / 32 kbps / 22.05 kHz**
  - **効果音 (WAV)**: **モノラル（1ch） / 11.025 kHz / 16-bit PCM**
* **音源の追加・変更手順**:
  1. 元音源（高音質版）を `BGM元サイズ/` フォルダへ配置。
  2. `python compress_bgm.py` を実行（自動で標準規格に圧縮され `bgm/` に配置されます）。
  3. 新曲追加時は `sw.js` の `ASSETS_TO_CACHE` および `js/audio.js` に登録。
  4. `index.html`、`js/main.js`、`sw.js` のバージョン番号を同期繰り上げ。

---

## 🚀 5. 更新・修正時の安全なGit運用手順

コードや音源を修正した場合、以下のルールに従ってGit更新を行います：

1. **`AGENTS.md` のルール遵守**:
   * コマンド実行前に必ず「更新前バージョン ➡ 更新後バージョン」を明示すること。
   * `index.html`、`js/main.js`、`sw.js` のバージョン番号・キャッシュ名を同期して繰り上げること。
2. **安全なステージング**:
   * `git add .` の一括指定は禁止。変更したファイルだけを個別に指定すること。
3. **コミット ＆ Push**:
   ```powershell
   git add index.html js/main.js sw.js compress_bgm.py ...
   git commit -m "feat: ○○機能の追加 (v1.1.x)"
   python update_changelog.py
   git add "バージョン履歴.md"
   git commit --amend --no-edit
   git push origin main
   ```

---
*最終更新日: 2026年9月2日 (v1.1.3)*
