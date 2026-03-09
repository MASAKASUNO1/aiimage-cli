import { writeFileSync, existsSync, unlinkSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { tmpdir } from "os";
import { randomBytes } from "crypto";
import { spawn } from "child_process";
import chalk from "chalk";

// sharpの遅延インポート
let sharp;

async function loadSharp() {
  if (sharp) return sharp;
  try {
    sharp = (await import("sharp")).default;
    return sharp;
  } catch {
    throw new Error(
      "sharpがインストールされていません。\n" +
      "以下のコマンドでインストールしてください:\n" +
      "  npm install -g aiimage-cli  (再インストール)\n" +
      "  または: npm install sharp"
    );
  }
}

/**
 * 一意な一時ファイルパスを生成
 */
function getTempFilePath(extension) {
  const uniqueId = randomBytes(8).toString("hex");
  return join(tmpdir(), `mermaid-${uniqueId}${extension}`);
}

/**
 * 背景色を解析してRGBAオブジェクトに変換
 */
function parseBackground(bg) {
  if (bg === "transparent") return { r: 0, g: 0, b: 0, alpha: 0 };
  if (bg === "white") return { r: 255, g: 255, b: 255, alpha: 1 };
  if (bg === "black") return { r: 0, g: 0, b: 0, alpha: 1 };

  if (bg.startsWith("#") && bg.length === 7) {
    return {
      r: parseInt(bg.slice(1, 3), 16),
      g: parseInt(bg.slice(3, 5), 16),
      b: parseInt(bg.slice(5, 7), 16),
      alpha: 1,
    };
  }

  if (bg.startsWith("#") && bg.length === 9) {
    return {
      r: parseInt(bg.slice(1, 3), 16),
      g: parseInt(bg.slice(3, 5), 16),
      b: parseInt(bg.slice(5, 7), 16),
      alpha: parseInt(bg.slice(7, 9), 16) / 255,
    };
  }

  console.warn(chalk.yellow(`Warning: 不正な背景色 "${bg}"。whiteを使用します。`));
  return { r: 255, g: 255, b: 255, alpha: 1 };
}

/**
 * mermaid-cliでMermaidをPNGに変換
 */
async function convertMermaidToPng(mermaidText, theme, background, tempMmdPath, tempPngPath) {
  writeFileSync(tempMmdPath, mermaidText, "utf8");

  const configPath = getTempFilePath(".json");
  writeFileSync(configPath, JSON.stringify({ theme }), "utf8");

  return new Promise((resolve, reject) => {
    const mmdc = spawn("npx", [
      "mmdc",
      "-i", tempMmdPath,
      "-o", tempPngPath,
      "-c", configPath,
      "-b", background,
      "-s", "2",
    ], {
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
    });

    let stderr = "";
    mmdc.stderr.on("data", (data) => { stderr += data.toString(); });

    mmdc.on("close", (code) => {
      try { unlinkSync(configPath); } catch {}
      if (code !== 0) {
        reject(new Error(`mermaid-cli failed (code ${code}): ${stderr}`));
      } else {
        resolve(tempPngPath);
      }
    });

    mmdc.on("error", (error) => {
      try { unlinkSync(configPath); } catch {}
      reject(new Error(
        `mermaid-cliの実行に失敗しました: ${error.message}\n` +
        "@mermaid-js/mermaid-cli がインストールされていることを確認してください:\n" +
        "  npm install -g @mermaid-js/mermaid-cli"
      ));
    });
  });
}

/**
 * Mermaidテキストを画像に変換
 * @returns {Promise<Buffer>} 画像バッファ
 */
export async function convertMermaid(options) {
  const {
    mermaidText,
    theme = "default",
    background = "white",
    width = 1920,
    height = 1080,
    quality = 85,
    format = "webp",
  } = options;

  await loadSharp();

  console.log(chalk.gray(`Theme: ${theme}`));
  console.log(chalk.gray(`Background: ${background}`));
  console.log(chalk.gray(`Size: ${width}x${height}`));
  console.log(chalk.gray(`Quality: ${quality}`));
  console.log(chalk.gray(`Format: ${format}`));

  console.log(chalk.cyan("\nConverting Mermaid..."));

  const tempMmdPath = getTempFilePath(".mmd");
  const tempPngPath = getTempFilePath(".png");

  try {
    // Mermaid → PNG
    await convertMermaidToPng(mermaidText, theme, background, tempMmdPath, tempPngPath);

    // PNG → 出力フォーマット
    const bg = parseBackground(background);

    let pipeline = sharp(tempPngPath)
      .resize(width, height, {
        fit: "contain",
        background: bg,
      });

    if (bg.alpha === 1) {
      pipeline = pipeline.flatten({ background: bg });
    }

    let buffer;
    if (format === "png") {
      buffer = await pipeline.png().toBuffer();
    } else {
      buffer = await pipeline.webp({ quality }).toBuffer();
    }

    console.log(chalk.gray("Conversion complete"));
    return buffer;

  } finally {
    try { if (existsSync(tempMmdPath)) unlinkSync(tempMmdPath); } catch {}
    try { if (existsSync(tempPngPath)) unlinkSync(tempPngPath); } catch {}
  }
}
