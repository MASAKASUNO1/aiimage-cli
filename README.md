# aiimage-cli

AI画像生成CLI - Gemini & fal.ai (GPT Image 1.5) をサポート

## インストール

```bash
npm install -g aiimage-cli
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
  "gemini": {
    "apiKey": "your-gemini-api-key",
    "model": "gemini-3-pro-image-preview",
    "defaultAspectRatio": "16:9"
  },
  "fal": {
    "apiKey": "your-fal-api-key",
    "model": "fal-ai/gpt-image-1.5",
    "defaultSize": "1536x1024",
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

## ライセンス

MIT
