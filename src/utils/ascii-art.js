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
${chalk.gray("  Gemini & fal.ai (GPT Image 1.5) powered")}
${chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
`;
  console.log(art);
}

export function showSetupComplete() {
  console.log(`
${chalk.green("✓")} ${chalk.white.bold("Setup complete!")}

${chalk.gray("Usage:")}
  ${chalk.cyan("aiimage")} ${chalk.yellow('"your prompt"')} ${chalk.gray("-o output.png")}

${chalk.gray("Examples:")}
  ${chalk.cyan("aiimage")} ${chalk.yellow('"A sunset over mountains"')} ${chalk.gray("-o sunset.png")}
  ${chalk.cyan("aiimage")} ${chalk.yellow('"Cute cat"')} ${chalk.gray("-o cat.png -P gemini -s hor")}
  ${chalk.cyan("aiimage")} ${chalk.yellow('"Modern logo"')} ${chalk.gray("-o logo.png -q high")}

${chalk.gray("More options:")}
  ${chalk.cyan("aiimage --help")}     ${chalk.gray("Show all options")}
  ${chalk.cyan("aiimage --config")}   ${chalk.gray("Open config file")}
`);
}
