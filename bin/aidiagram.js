#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { createRequire } from "module";
import { generateDiagram, runSetup, openConfig } from "../src/index.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

const program = new Command();

program
  .name("aidiagram")
  .description("AI Diagram Generator CLI - Gemini powered")
  .version(version)
  .argument("[prompt]", "Diagram description prompt")
  .option("-o, --output <path>", "Output file path (required, .png .webp .jpg .svg)")
  .option("-t, --theme <theme>", "Theme: dark or light (default: dark)")
  .option("-m, --model <model>", "Gemini model ID")
  .option("--config", "Open config file in editor")
  .option("--setup", "Run setup wizard")
  .addHelpText("after", `
${chalk.gray("Examples:")}
  ${chalk.cyan("aidiagram")} ${chalk.yellow('"システムアーキテクチャ図"')} ${chalk.gray("-o arch.png")}
  ${chalk.cyan("aidiagram")} ${chalk.yellow('"API連携のフロー図"')} ${chalk.gray("-o flow.webp -t light")}
  ${chalk.cyan("aidiagram")} ${chalk.yellow('"マイクロサービス構成図"')} ${chalk.gray("-o microservice.png")}
  ${chalk.cyan("aidiagram")} ${chalk.yellow('"ER図"')} ${chalk.gray("-o er.svg")}  ${chalk.gray("(SVG raw output)")}

${chalk.gray("Output formats:")}
  ${chalk.white(".png")}    PNG image (recommended)
  ${chalk.white(".webp")}   WebP image
  ${chalk.white(".jpg")}    JPEG image
  ${chalk.white(".svg")}    Raw SVG (no image conversion)

${chalk.gray("Theme options:")}
  ${chalk.white("dark")}    Dark theme with blue/green/pink accents (default)
  ${chalk.white("light")}   Light theme with blue/green/red accents

${chalk.gray("Configuration:")}
  ${chalk.cyan("aidiagram --config")}   Open config file to edit API keys and defaults
  ${chalk.cyan("aidiagram --setup")}    Re-run initial setup wizard
`);

program.parse();

const options = program.opts();
const [prompt] = program.args;

async function main() {
  if (options.config) {
    await openConfig();
    return;
  }

  if (options.setup) {
    await runSetup();
    return;
  }

  if (!prompt) {
    console.error(chalk.red("Error: prompt is required"));
    console.log(chalk.gray("\nUsage: aidiagram <prompt> -o <output.png>"));
    console.log(chalk.gray("Run 'aidiagram --help' for more options."));
    process.exit(1);
  }

  if (!options.output) {
    console.error(chalk.red("Error: --output (-o) is required"));
    console.log(chalk.gray("\nUsage: aidiagram <prompt> -o <output.png>"));
    process.exit(1);
  }

  await generateDiagram({
    prompt,
    output: options.output,
    theme: options.theme,
    model: options.model,
  });
}

main().catch((error) => {
  console.error(chalk.red(`Error: ${error.message}`));
  process.exit(1);
});
