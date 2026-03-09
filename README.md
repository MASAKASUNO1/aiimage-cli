# aiimage-cli

AI画像生成CLI - Gemini, fal.ai, SVG Diagram, Mermaid変換をサポート

3つのコマンドを提供:

| コマンド | 用途 | 必要なAPIキー |
|---------|------|--------------|
| `aiimage` | AI画像生成 | Gemini or fal.ai |
| `aidiagram` | AI SVG図解→画像 | Gemini |
| `aimermaid` | Mermaid→画像変換 | なし |

## インストール

```bash
npm install -g aiimage-cli
```

`aimermaid` を使う場合は mermaid-cli も必要です:

```bash
npm install -g @mermaid-js/mermaid-cli
```

## 初回セットアップ

初めて実行すると、セットアップウィザードが起動します:

```bash
aiimage "test prompt" -o test.png
```

または手動でセットアップ:

```bash
aiimage --setup
```

以下のAPIキーを設定します:
- **Gemini API Key**: https://aistudio.google.com/apikey
- **fal.ai API Key**: https://fal.ai/dashboard/keys

## 基本的な使い方

```bash
# シンプルな画像生成 (fal.ai使用)
aiimage "A sunset over mountains" -o sunset.png

# 高品質モード
aiimage "Cute cat portrait" -o cat.png -q high

# Geminiを使用
aiimage "Modern abstract art" -o art.png -P gemini

# 参照画像を使用 (Geminiのみ)
aiimage "Same style image" -o new.png -P gemini -r reference.png
```

## オプション

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `-o, --output <path>` | 出力ファイルパス (必須) | - |
| `-P, --provider <name>` | プロバイダー: `gemini` or `fal` | config |
| `-s, --size <size>` | サイズ: `square`, `hor`, `ver` | `hor` |
| `-q, --quality <level>` | 品質: `low`, `medium`, `high` (fal用) | `low` |
| `-r, --ref-image <path>` | 参照画像パス (gemini用) | - |
| `--ref-instruction <text>` | 参照画像の使用指示 | - |
| `--config` | 設定ファイルを開く | - |
| `--setup` | セットアップウィザードを実行 | - |

## サイズオプション

| サイズ | 説明 | fal.ai | Gemini |
|-------|------|--------|--------|
| `hor` | 横長 (デフォルト) | 1536x1024 | 16:9 |
| `square` | 正方形 | 1024x1024 | 1:1 |
| `ver` | 縦長 | 1024x1536 | 9:16 |

## 品質レベル (fal.ai)

| レベル | 説明 |
|-------|------|
| `low` | 高速生成、シンプルな画像向け |
| `medium` | バランス型、詳細な画像向け |
| `high` | 最高品質、日本語テキスト含む詳細画像向け |

## 設定

設定ファイルは `~/.aiimage/config.json` に保存されます。

```bash
# 設定ファイルを開く
aiimage --config
```

### 設定ファイルの例

```json
{
  "defaultProvider": "fal",
  "defaultSize": "hor",
  "gemini": {
    "apiKey": "your-gemini-api-key",
    "model": "gemini-3.1-flash-image-preview"
  },
  "fal": {
    "apiKey": "your-fal-api-key",
    "model": "fal-ai/gpt-image-1.5",
    "defaultQuality": "low"
  }
}
```

## 例

```bash
# YouTubeサムネイル用 (高品質、横長)
aiimage "AIの未来を語る女性YouTuber、驚きの表情" -o thumbnail.png -q high

# SNS用正方形画像
aiimage "Minimalist coffee cup illustration" -o coffee.png -s square

# 縦長のポートレート
aiimage "Portrait of a woman" -o portrait.png -s ver -q medium

# Geminiを使用
aiimage "Abstract technology background" -o bg.png -P gemini

# 参照画像を使ってスタイルを真似る (Gemini)
aiimage "新しいテーマで同じスタイル" -o styled.png -P gemini -r original.png --ref-instruction "この画像の色彩とタッチを真似て"
```

## aidiagram - AI図解生成

Gemini APIでSVG図解を生成し、画像で出力します。

```bash
# PNG出力（推奨）
aidiagram "システムアーキテクチャ図" -o arch.png

# ライトテーマ
aidiagram "API連携フロー" -o flow.webp -t light

# SVG生出力
aidiagram "ER図" -o er.svg
```

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `-o, --output <path>` | 出力パス `.png` `.webp` `.jpg` `.svg` | - |
| `-t, --theme <theme>` | `dark` or `light` | `dark` |
| `-m, --model <model>` | Gemini モデルID | `gemini-3-flash-preview` |

## aimermaid - Mermaid図変換

Mermaidテキストを画像に変換します。APIキー不要。

```bash
# インライン
aimermaid "graph TD; A-->B-->C" -o flow.webp

# ファイルから
aimermaid -i diagram.mmd -o output.webp

# ダークテーマ + PNG
aimermaid -i seq.mmd -o seq.png -t dark -b black
```

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `-i, --input <path>` | 入力 `.mmd` ファイル | - |
| `-o, --output <path>` | 出力パス `.webp` `.png` | - |
| `-t, --theme <theme>` | `default` `dark` `forest` `neutral` | `default` |
| `-b, --background <color>` | 背景色 | `white` |
| `-W, --width <px>` | 出力幅 | `1920` |
| `-H, --height <px>` | 出力高さ | `1080` |
| `-q, --quality <n>` | WebP品質 1-100 | `85` |

> **前提条件**: `npm install -g @mermaid-js/mermaid-cli` が必要です。

## ライセンス

MIT

## リリース手順（npm）

```bash
# 内容確認（公開されるファイル一覧）
npm run pack:check

# バージョン更新（例: patch）
npm version patch

# 公開
npm publish
```
