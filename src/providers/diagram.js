import { GoogleGenerativeAI } from "@google/generative-ai";
import chalk from "chalk";

let DOMParser;

async function loadXmldom() {
  if (DOMParser) return;
  try {
    DOMParser = (await import("@xmldom/xmldom")).DOMParser;
  } catch {
    // バリデーションをスキップ
    DOMParser = null;
  }
}

/**
 * SVGバリデーション
 */
function validateSvg(svg) {
  const errors = [];

  if (!svg.includes("<svg")) {
    errors.push("<svg>タグが見つかりません");
  }
  if (!svg.includes("</svg>")) {
    errors.push("</svg>閉じタグが見つかりません");
  }

  if (!DOMParser) {
    return { valid: errors.length === 0, errors };
  }

  const parseErrors = [];
  const parser = new DOMParser({
    onError: (level, msg) => {
      if (level !== "warning") parseErrors.push(msg);
    },
  });

  try {
    const doc = parser.parseFromString(svg, "image/svg+xml");
    const svgElement = doc.getElementsByTagName("svg")[0];

    if (!svgElement) {
      errors.push("SVGルート要素が見つかりません");
    } else {
      if (!svgElement.getAttribute("viewBox")) {
        errors.push('viewBox属性がありません（推奨: viewBox="0 0 1920 1080"）');
      }
      if (!svgElement.getAttribute("xmlns")) {
        errors.push('xmlns属性がありません（必須: xmlns="http://www.w3.org/2000/svg"）');
      }
    }
  } catch (e) {
    errors.push(`XMLパースエラー: ${e.message}`);
  }

  if (parseErrors.length > 0) {
    errors.push(...parseErrors.slice(0, 5));
  }

  return { valid: errors.length === 0, errors };
}

/**
 * システムプロンプトを構築
 */
function buildSystemPrompt(theme) {
  return `あなたはSVG図解の専門デザイナーです。ユーザーのリクエストに基づいて、プロフェッショナルなSVG図解を生成してください。

## 出力ルール
- 純粋なSVGコードのみを出力（\`\`\`などのマークダウンは不要）
- <?xml version="1.0" encoding="UTF-8"?> ヘッダーを含める
- viewBox="0 0 1920 1080" で16:9アスペクト比
- 日本語フォント: 'Noto Sans JP', 'Hiragino Sans', sans-serif
- 英語フォント: 'Inter', 'Helvetica Neue', Arial, sans-serif

## テーマ: ${theme === "light" ? "ライト" : "ダーク"}系
${
  theme === "light"
    ? `背景: #ffffff〜#f8fafc
テキスト: #1e293b, #475569
アクセント: #3b82f6 (青), #10b981 (緑), #ef4444 (赤)`
    : `背景: #0f172a〜#1e293b
テキスト: #f8fafc, #94a3b8
アクセント: #38bdf8 (青), #34d399 (緑), #f472b6 (ピンク)`
}

## デザイン方針
- 明確な視覚的階層
- 適切な余白とバランス
- 矢印・コネクタで関係性を表現
- グラデーション・シャドウで立体感を演出
- 読みやすいフォントサイズ（最小18px）

## 重要：ユーザー向けドキュメントとしての品質
この図は**ユーザーに直接見せるドキュメント**です。以下を必ず最適化してください：

### フォントサイズの階層化
- タイトル: 48-64px（太字、目立つ配色）
- サブタイトル: 32-40px
- 見出し・ラベル: 24-28px（font-weight: 700）
- 本文・説明: 20-24px（font-weight: 400-500）
- 注釈・補足: 16-18px（薄めの色）

### font-weightによる視覚的強調
- 最重要情報: font-weight: 800-900
- 見出し・キーワード: font-weight: 700
- 通常テキスト: font-weight: 400-500
- 補足情報: font-weight: 300

### 視認性の確保
- 背景とのコントラスト比を十分に確保
- 重要な情報ほど大きく・太く・目立つ色で
- 関連情報はグルーピングして配置
- 一目で構造が理解できるレイアウト

創造性を発揮して、美しく分かりやすい図解を作成してください。`;
}

/**
 * Gemini APIでSVG図解を生成
 * @returns {{ svg: string, validation: { valid: boolean, errors: string[] } }}
 */
export async function generateDiagramWithGemini(options) {
  await loadXmldom();

  const {
    apiKey,
    model = "gemini-3-flash-preview",
    prompt,
    theme = "dark",
  } = options;

  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({
    model,
    systemInstruction: buildSystemPrompt(theme),
  });

  console.log(chalk.gray(`Model: ${model}`));
  console.log(chalk.gray(`Theme: ${theme}`));
  console.log(chalk.gray(`Prompt: ${prompt.substring(0, 100)}${prompt.length > 100 ? "..." : ""}`));

  console.log(chalk.cyan("\nGenerating SVG diagram..."));

  const start = Date.now();

  const result = await geminiModel.generateContent(prompt);
  const response = result.response;

  const duration = Date.now() - start;
  console.log(chalk.gray(`Generated in ${duration}ms`));

  let svg = response.text()?.trim();
  if (!svg) {
    throw new Error("レスポンスが空です。プロンプトを変えて再試行してください。");
  }

  // マークダウンコードブロックが含まれていたら除去
  svg = svg.replace(/^```(?:xml|svg)?\n?/i, "").replace(/\n?```$/i, "");

  // SVGバリデーション
  const validation = validateSvg(svg);

  if (validation.valid) {
    console.log(chalk.green("SVG Validation: OK"));
  } else {
    console.log(chalk.yellow("\nSVG Validation warnings:"));
    validation.errors.forEach((err, i) => console.log(chalk.yellow(`  ${i + 1}. ${err}`)));
  }

  return { svg, validation };
}
