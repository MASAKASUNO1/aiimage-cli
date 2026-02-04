#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { createRequire } from "module";
import { generate, runSetup, openConfig } from "../src/index.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

const program = new Command();

program
  .name("aiimage")
  .description("AI Image Generator CLI - Gemini & fal.ai (GPT Image 1.5)")
  .version(version)
  .argument("[prompt]", "Image generation prompt")
  .option("-o, --output <path>", "Output file path (required)")
  .option("-P, --provider <name>", "Provider: gemini or fal (default: from config)")
  .option("-s, --size <size>", "Image size: square, hor, ver (default: hor)")
  .option("-q, --quality <level>", "Quality for fal: low, medium, high")
  .option("-r, --ref-image <path>", "Reference image path (gemini only)")
  .option("--ref-instruction <text>", "Instruction for reference image")
  .option("--config", "Open config file in editor")
  .option("--setup", "Run setup wizard")
  .addHelpText("after", `
${chalk.gray("Examples:")}
  ${chalk.cyan("aiimage")} ${chalk.yellow('"A sunset over mountains"')} ${chalk.gray("-o sunset.png")}
  ${chalk.cyan("aiimage")} ${chalk.yellow('"Cute cat portrait"')} ${chalk.gray("-o cat.png -s square")}
  ${chalk.cyan("aiimage")} ${chalk.yellow('"Portrait photo"')} ${chalk.gray("-o portrait.png -s ver -q high")}
  ${chalk.cyan("aiimage")} ${chalk.yellow('"Modern abstract art"')} ${chalk.gray("-o art.png -P gemini")}

${chalk.gray("Size options:")}
  ${chalk.white("hor")}     Horizontal/Landscape (default)
  ${chalk.white("square")}  Square
  ${chalk.white("ver")}     Vertical/Portrait

${chalk.gray("Quality levels (fal.ai):")}
  ${chalk.white("low")}     Fast generation, good for simple images
  ${chalk.white("medium")}  Balanced, recommended for most use cases
  ${chalk.white("high")}    Best quality, includes detailed text rendering

${chalk.gray("Configuration:")}
  ${chalk.cyan("aiimage --config")}   Open config file to edit API keys and defaults
  ${chalk.cyan("aiimage --setup")}    Re-run initial setup wizard
`);

program.parse();

const options = program.opts();
const [prompt] = program.args;

async function main() {
  // --config オプション
  if (options.config) {
    await openConfig();
    return;
  }

  // --setup オプション
  if (options.setup) {
    await runSetup();
    return;
  }

  // プロンプトがない場合
  if (!prompt) {
    console.error(chalk.red("Error: prompt is required"));
    console.log(chalk.gray("\nUsage: aiimage <prompt> -o <output>"));
    console.log(chalk.gray("Run 'aiimage --help' for more options."));
    process.exit(1);
  }

  // 出力パスがない場合
  if (!options.output) {
    console.error(chalk.red("Error: --output (-o) is required"));
    console.log(chalk.gray("\nUsage: aiimage <prompt> -o <output>"));
    process.exit(1);
  }

  // 画像生成を実行
  await generate({
    prompt,
    output: options.output,
    provider: options.provider,
    size: options.size,
    quality: options.quality,
    refImage: options.refImage,
    refInstruction: options.refInstruction
  });
}

main().catch((error) => {
  console.error(chalk.red(`Error: ${error.message}`));
  process.exit(1);
});
