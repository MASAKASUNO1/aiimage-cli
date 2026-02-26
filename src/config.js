import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { homedir } from "os";
import inquirer from "inquirer";
import open from "open";
import chalk from "chalk";
import { showWelcome, showSetupComplete } from "./utils/ascii-art.js";

// 設定ファイルのパス
const CONFIG_DIR = join(homedir(), ".aiimage");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

// デフォルト設定
const DEFAULT_CONFIG = {
  defaultProvider: "fal",
  defaultSize: "hor",
  supportedSizes: ["square", "hor", "ver"],
  sizeMapping: {
    fal: {
      square: "1024x1024",
      hor: "1536x1024",
      ver: "1024x1536"
    },
    gemini: {
      square: "1:1",
      hor: "16:9",
      ver: "9:16"
    }
  },
  gemini: {
    apiKey: "",
    model: "gemini-3.1-flash-image-preview"
  },
  fal: {
    apiKey: "",
    model: "fal-ai/gpt-image-1.5",
    defaultQuality: "low",
    supportedQualities: ["low", "medium", "high"]
  }
};

/**
 * 設定ファイルが存在するかチェック
 */
export function configExists() {
  return existsSync(CONFIG_PATH);
}

/**
 * 設定ファイルを読み込む
 */
export function loadConfig() {
  if (!configExists()) {
    return null;
  }
  try {
    const content = readFileSync(CONFIG_PATH, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(content) };
  } catch (error) {
    console.error(chalk.red(`Error loading config: ${error.message}`));
    return null;
  }
}

/**
 * 設定ファイルを保存
 */
export function saveConfig(config) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

/**
 * 設定ファイルをエディタで開く
 */
export async function openConfig() {
  if (!configExists()) {
    console.log(chalk.yellow("Config file not found. Running setup first..."));
    await runSetup();
    return;
  }
  console.log(chalk.gray(`Opening config: ${CONFIG_PATH}`));
  await open(CONFIG_PATH);
}

/**
 * 初回セットアップを実行
 */
export async function runSetup() {
  showWelcome();

  console.log(chalk.white.bold("\nLet's set up your API keys.\n"));

  const answers = await inquirer.prompt([
    {
      type: "password",
      name: "geminiApiKey",
      message: chalk.cyan("Gemini API Key") + chalk.gray(" (from https://aistudio.google.com/apikey):"),
      mask: "*",
      validate: (input) => {
        if (!input.trim()) {
          return chalk.yellow("You can leave empty and set later via --config");
        }
        return true;
      },
      filter: (input) => input.trim()
    },
    {
      type: "password",
      name: "falApiKey",
      message: chalk.cyan("fal.ai API Key") + chalk.gray(" (from https://fal.ai/dashboard/keys):"),
      mask: "*",
      validate: (input) => {
        if (!input.trim()) {
          return chalk.yellow("You can leave empty and set later via --config");
        }
        return true;
      },
      filter: (input) => input.trim()
    },
    {
      type: "list",
      name: "defaultProvider",
      message: chalk.cyan("Default provider:"),
      choices: [
        { name: "fal.ai (GPT Image 1.5) - Recommended", value: "fal" },
        { name: "Gemini", value: "gemini" }
      ],
      default: "fal"
    },
    {
      type: "list",
      name: "defaultQuality",
      message: chalk.cyan("Default quality (for fal.ai):"),
      choices: [
        { name: "low - Fast, good for simple images", value: "low" },
        { name: "medium - Balanced, good for detailed images", value: "medium" },
        { name: "high - Best quality, slower", value: "high" }
      ],
      default: "low"
    }
  ]);

  const config = {
    ...DEFAULT_CONFIG,
    defaultProvider: answers.defaultProvider,
    gemini: {
      ...DEFAULT_CONFIG.gemini,
      apiKey: answers.geminiApiKey || ""
    },
    fal: {
      ...DEFAULT_CONFIG.fal,
      apiKey: answers.falApiKey || "",
      defaultQuality: answers.defaultQuality
    }
  };

  saveConfig(config);

  console.log(chalk.gray(`\nConfig saved to: ${CONFIG_PATH}`));
  showSetupComplete();
}

/**
 * APIキーが設定されているかチェック
 */
export function validateApiKey(config, provider) {
  const key = provider === "gemini"
    ? config.gemini.apiKey
    : config.fal.apiKey;

  if (!key) {
    console.error(chalk.red(`\nError: ${provider} API key is not set.`));
    console.log(chalk.gray(`Run ${chalk.cyan("aiimage --config")} to set your API key.`));
    process.exit(1);
  }
  return key;
}

export { CONFIG_PATH };
