import chalk from "chalk";

export function showWelcome() {
  const art = `
${chalk.cyan("    ___    ____   ____  __  __    ___    ______ ______")}
${chalk.cyan("   /   |  /  _/  /  _/ /  |/  |  /   |  / ____// ____/")}
${chalk.cyan("  / /| |  / /    / /  / /|_/ /  / /| | / / __ / __/   ")}
${chalk.cyan(" / ___ |_/ /   _/ /  / /  / /  / ___ |/ /_/ // /___   ")}
${chalk.cyan("/_/  |_/___/  /___/ /_/  /_/  /_/  |_|\\____//_____/   ")}

${chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
${chalk.white.bold("  AI Image Generator CLI")}
${chalk.gray("  Gemini, fal.ai, SVG Diagram & Mermaid powered")}
${chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
`;
  console.log(art);
}

export function showSetupComplete() {
  console.log(`
${chalk.green("✓")} ${chalk.white.bold("Setup complete!")}

${chalk.gray("Image generation:")}
  ${chalk.cyan("aiimage")} ${chalk.yellow('"your prompt"')} ${chalk.gray("-o output.png")}

${chalk.gray("SVG diagram generation:")}
  ${chalk.cyan("aidiagram")} ${chalk.yellow('"system architecture"')} ${chalk.gray("-o arch.svg")}

${chalk.gray("Mermaid to image:")}
  ${chalk.cyan("aimermaid")} ${chalk.yellow('"graph TD; A-->B"')} ${chalk.gray("-o flow.webp")}
  ${chalk.cyan("aimermaid")} ${chalk.gray("-i diagram.mmd -o output.webp")}

${chalk.gray("More options:")}
  ${chalk.cyan("<command> --help")}     ${chalk.gray("Show all options")}
  ${chalk.cyan("<command> --config")}   ${chalk.gray("Open config file")}
`);
}
