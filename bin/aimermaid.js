#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { createRequire } from "module";
import { generateMermaid, runSetup, openConfig } from "../src/index.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

const program = new Command();

program
  .name("aimermaid")
  .description("Mermaid to Image Converter CLI")
  .version(version)
  .argument("[mermaid]", "Mermaid diagram text (inline)")
  .option("-i, --input <path>", "Input .mmd file path")
  .option("-o, --output <path>", "Output file path (required, .webp or .png)")
  .option("-t, --theme <theme>", "Mermaid theme: default, dark, forest, neutral")
  .option("-b, --background <color>", "Background: transparent, white, black, #RRGGBB")
  .option("-W, --width <px>", "Output width in pixels", "1920")
  .option("-H, --height <px>", "Output height in pixels", "1080")
  .option("-q, --quality <n>", "WebP quality 1-100", "85")
  .option("--config", "Open config file in editor")
  .option("--setup", "Run setup wizard")
  .addHelpText("after", `
${chalk.gray("Examples:")}
  ${chalk.cyan("aimermaid")} ${chalk.yellow('"graph TD; A-->B-->C"')} ${chalk.gray("-o flow.webp")}
  ${chalk.cyan("aimermaid")} ${chalk.gray("-i diagram.mmd -o output.webp")}
  ${chalk.cyan("aimermaid")} ${chalk.gray("-i seq.mmd -o seq.webp -t dark -b black")}
  ${chalk.cyan("aimermaid")} ${chalk.yellow('"pie title Pets; \\"Dogs\\" : 50; \\"Cats\\" : 30"')} ${chalk.gray("-o pie.png")}

${chalk.gray("Input modes:")}
  ${chalk.white("inline")}   Pass Mermaid text as the first argument
  ${chalk.white("-i")}       Read from a .mmd file

${chalk.gray("Theme options:")}
  ${chalk.white("default")}   Default Mermaid theme
  ${chalk.white("dark")}      Dark theme
  ${chalk.white("forest")}    Forest green theme
  ${chalk.white("neutral")}   Neutral/minimal theme

${chalk.gray("Configuration:")}
  ${chalk.cyan("aimermaid --config")}   Open config file to edit defaults
  ${chalk.cyan("aimermaid --setup")}    Re-run initial setup wizard
`);

program.parse();

const opts = program.opts();
const [mermaidText] = program.args;

async function main() {
  if (opts.config) {
    await openConfig();
    return;
  }

  if (opts.setup) {
    await runSetup();
    return;
  }

  if (!mermaidText && !opts.input) {
    console.error(chalk.red("Error: Mermaid text or --input (-i) is required"));
    console.log(chalk.gray("\nUsage: aimermaid <mermaid-text> -o <output>"));
    console.log(chalk.gray("       aimermaid -i <file.mmd> -o <output>"));
    console.log(chalk.gray("Run 'aimermaid --help' for more options."));
    process.exit(1);
  }

  if (!opts.output) {
    console.error(chalk.red("Error: --output (-o) is required"));
    console.log(chalk.gray("\nUsage: aimermaid <mermaid-text> -o <output>"));
    process.exit(1);
  }

  await generateMermaid({
    mermaidText,
    input: opts.input,
    output: opts.output,
    theme: opts.theme,
    background: opts.background,
    width: parseInt(opts.width, 10),
    height: parseInt(opts.height, 10),
    quality: parseInt(opts.quality, 10),
  });
}

main().catch((error) => {
  console.error(chalk.red(`Error: ${error.message}`));
  process.exit(1);
});
