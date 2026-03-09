import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { dirname, resolve, extname } from "path";
import chalk from "chalk";
import {
  loadConfig,
  configExists,
  runSetup,
  openConfig,
  validateApiKey
} from "./config.js";
import { generateWithGemini } from "./providers/gemini.js";
import { generateWithFal } from "./providers/fal.js";
import { generateDiagramWithGemini } from "./providers/diagram.js";
import { convertMermaid } from "./providers/mermaid.js";

/**
 * 画像を保存
 */
function saveImage(buffer, outputPath) {
  const outputDir = dirname(outputPath);
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPath, buffer);
  console.log(chalk.green(`\n✓ Image saved to: ${outputPath}`));
}

/**
 * メイン処理
 */
export async function generate(options) {
  // 設定チェック
  if (!configExists()) {
    console.log(chalk.yellow("First time setup required.\n"));
    await runSetup();
  }

  const config = loadConfig();
  if (!config) {
    console.error(chalk.red("Failed to load config. Run 'aiimage --setup' to reconfigure."));
    process.exit(1);
  }

  // オプションの解決
  const provider = options.provider || config.defaultProvider;
  const prompt = options.prompt;
  const output = resolve(options.output);

  // 出力ファイルの拡張子チェック
  const ext = extname(output).toLowerCase();
  if (![".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
    console.error(chalk.red(`Unsupported output format: ${ext}`));
    console.log(chalk.gray("Supported formats: .png, .jpg, .jpeg, .webp"));
    process.exit(1);
  }

  // APIキー検証
  const apiKey = validateApiKey(config, provider);

  console.log(chalk.white.bold(`\nProvider: ${provider === "gemini" ? "Gemini" : "fal.ai (GPT Image 1.5)"}\n`));

  // サイズの解決 (square, hor, ver)
  const sizeKey = options.size || config.defaultSize;
  if (!config.supportedSizes.includes(sizeKey)) {
    console.error(chalk.red(`Unsupported size: ${sizeKey}`));
    console.log(chalk.gray(`Supported: ${config.supportedSizes.join(", ")}`));
    process.exit(1);
  }

  let buffer;

  try {
    if (provider === "gemini") {
      // Gemini用: sizeKeyをアスペクト比に変換
      const aspectRatio = config.sizeMapping.gemini[sizeKey];

      buffer = await generateWithGemini({
        apiKey,
        model: config.gemini.model,
        prompt,
        aspectRatio,
        refImage: options.refImage,
        refInstruction: options.refInstruction
      });
    } else {
      // fal.ai用: sizeKeyをピクセルサイズに変換
      const size = config.sizeMapping.fal[sizeKey];
      const quality = options.quality || config.fal.defaultQuality;

      // 品質の検証
      if (!config.fal.supportedQualities.includes(quality)) {
        console.error(chalk.red(`Unsupported quality: ${quality}`));
        console.log(chalk.gray(`Supported: ${config.fal.supportedQualities.join(", ")}`));
        process.exit(1);
      }

      buffer = await generateWithFal({
        apiKey,
        model: config.fal.model,
        prompt,
        size,
        quality
      });
    }

    saveImage(buffer, output);
    console.log(chalk.green("✓ Image generation completed!"));

  } catch (error) {
    console.error(chalk.red(`\nError: ${error.message}`));
    process.exit(1);
  }
}

/**
 * SVGをsharpで画像バッファに変換
 */
async function svgToImage(svgText, ext) {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    throw new Error(
      "sharpがインストールされていません。\n" +
      "  npm install sharp"
    );
  }

  // SVG内のHTMLエンティティをUnicode文字に置換（librsvgが処理できないため）
  let cleaned = svgText;
  // 既知のHTMLエンティティをUnicodeに変換
  const entities = { "&copy;": "\u00A9", "&reg;": "\u00AE", "&trade;": "\u2122", "&nbsp;": "\u00A0", "&mdash;": "\u2014", "&ndash;": "\u2013", "&laquo;": "\u00AB", "&raquo;": "\u00BB", "&bull;": "\u2022" };
  for (const [entity, char] of Object.entries(entities)) {
    cleaned = cleaned.replaceAll(entity, char);
  }
  // 裸の & （XMLエンティティ参照でないもの）を &amp; にエスケープ
  cleaned = cleaned.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g, "&amp;");

  let pipeline = sharp(Buffer.from(cleaned)).resize(1920, 1080, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } });

  if (ext === ".png") {
    return pipeline.png().toBuffer();
  } else if (ext === ".jpg" || ext === ".jpeg") {
    return pipeline.flatten({ background: { r: 255, g: 255, b: 255 } }).jpeg({ quality: 90 }).toBuffer();
  } else {
    return pipeline.webp({ quality: 90 }).toBuffer();
  }
}

/**
 * SVG図解を生成して画像出力
 */
export async function generateDiagram(options) {
  // diagramはGemini APIキーが必要なので、設定がなければセットアップを促す
  if (!configExists()) {
    console.log(chalk.yellow("First time setup required.\n"));
    await runSetup();
  }

  const config = loadConfig();
  if (!config) {
    console.error(chalk.red("Failed to load config. Run 'aidiagram --setup' to reconfigure."));
    process.exit(1);
  }

  const output = resolve(options.output);

  // 出力ファイルの拡張子チェック
  const ext = extname(output).toLowerCase();
  if (![".png", ".jpg", ".jpeg", ".webp", ".svg"].includes(ext)) {
    console.error(chalk.red(`Unsupported output format: ${ext}`));
    console.log(chalk.gray("Supported formats: .png, .jpg, .jpeg, .webp, .svg"));
    process.exit(1);
  }

  // APIキー検証（Gemini APIキーを使用）
  const apiKey = validateApiKey(config, "gemini");

  const theme = options.theme || config.diagram.defaultTheme;
  const model = options.model || config.diagram.model;

  console.log(chalk.white.bold(`\nProvider: Gemini\n`));

  try {
    const { svg } = await generateDiagramWithGemini({
      apiKey,
      model,
      prompt: options.prompt,
      theme,
    });

    const outputDir = dirname(output);
    mkdirSync(outputDir, { recursive: true });

    if (ext === ".svg") {
      writeFileSync(output, svg, "utf-8");
    } else {
      const buffer = await svgToImage(svg, ext);
      writeFileSync(output, buffer);
    }

    console.log(chalk.green(`\n✓ Diagram saved to: ${output}`));
    console.log(chalk.green("✓ Diagram generation completed!"));

  } catch (error) {
    console.error(chalk.red(`\nError: ${error.message}`));
    process.exit(1);
  }
}

/**
 * MermaidテキストをWebP/PNG画像に変換
 * APIキー不要 — 設定ファイルがなくてもデフォルト値で動作する
 */
export async function generateMermaid(options) {
  const config = configExists() ? loadConfig() : {};

  const output = resolve(options.output);

  // 出力ファイルの拡張子チェック
  const ext = extname(output).toLowerCase();
  if (![".webp", ".png"].includes(ext)) {
    console.error(chalk.red(`Unsupported output format: ${ext}`));
    console.log(chalk.gray("Supported formats: .webp, .png"));
    process.exit(1);
  }

  // Mermaidテキストの取得
  let mermaidText;

  if (options.input) {
    const inputPath = resolve(options.input);
    if (!existsSync(inputPath)) {
      console.error(chalk.red(`Input file not found: ${inputPath}`));
      process.exit(1);
    }
    mermaidText = readFileSync(inputPath, "utf-8");
  } else if (options.mermaidText) {
    mermaidText = options.mermaidText;
  } else {
    console.error(chalk.red("Error: Mermaid text or --input (-i) is required"));
    process.exit(1);
  }

  if (!mermaidText.trim()) {
    console.error(chalk.red("Error: Mermaid text is empty"));
    process.exit(1);
  }

  const mermaidConfig = config.mermaid || {};

  console.log(chalk.white.bold(`\nMermaid to ${ext.slice(1).toUpperCase()} Converter\n`));

  try {
    const buffer = await convertMermaid({
      mermaidText,
      theme: options.theme || mermaidConfig.defaultTheme || "default",
      background: options.background || mermaidConfig.defaultBackground || "white",
      width: options.width || mermaidConfig.defaultWidth || 1920,
      height: options.height || mermaidConfig.defaultHeight || 1080,
      quality: options.quality || mermaidConfig.defaultQuality || 85,
      format: ext.slice(1),
    });

    // 画像を保存
    saveImage(buffer, output);
    console.log(chalk.green("✓ Mermaid conversion completed!"));

  } catch (error) {
    console.error(chalk.red(`\nError: ${error.message}`));
    process.exit(1);
  }
}

export { runSetup, openConfig };
