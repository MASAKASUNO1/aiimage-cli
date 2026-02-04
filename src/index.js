import { writeFileSync, mkdirSync } from "fs";
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

export { runSetup, openConfig };
