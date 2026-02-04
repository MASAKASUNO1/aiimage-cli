import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync, existsSync } from "fs";
import { extname } from "path";
import chalk from "chalk";

/**
 * 画像ファイルをBase64に変換
 */
function imageToBase64(imagePath) {
  if (!existsSync(imagePath)) {
    throw new Error(`Reference image not found: ${imagePath}`);
  }

  const imageBuffer = readFileSync(imagePath);
  const base64Data = imageBuffer.toString("base64");

  const ext = extname(imagePath).toLowerCase();
  const mimeTypes = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  const mimeType = mimeTypes[ext] || "image/png";

  return { base64Data, mimeType };
}

/**
 * Gemini APIで画像を生成
 */
export async function generateWithGemini(options) {
  const {
    apiKey,
    model,
    prompt,
    aspectRatio,
    refImage,
    refInstruction
  } = options;

  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({
    model: model,
    generationConfig: {
      responseModalities: ["image", "text"],
    },
  });

  // プロンプトの構築
  const fullPrompt = `${prompt}

Generate the image with aspect ratio ${aspectRatio}.`;

  console.log(chalk.gray(`Model: ${model}`));
  console.log(chalk.gray(`Aspect Ratio: ${aspectRatio}`));
  console.log(chalk.gray(`Prompt: ${prompt.substring(0, 100)}${prompt.length > 100 ? "..." : ""}`));

  // リクエストの構築
  const parts = [];
  let instructionPrefix = "";

  // 参照画像がある場合は追加
  if (refImage) {
    console.log(chalk.gray(`Reference Image: ${refImage}`));
    const { base64Data, mimeType } = imageToBase64(refImage);
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      },
    });

    const defaultRefInstruction = "この参照画像のスタイル、構図、雰囲気を参考にして、新しい画像を生成してください。";
    instructionPrefix = `【参照画像】${refInstruction || defaultRefInstruction}\n\n`;
  }

  // テキストパートを追加
  parts.push({
    text: instructionPrefix + fullPrompt,
  });

  console.log(chalk.cyan("\nGenerating with Gemini..."));

  const response = await geminiModel.generateContent({
    contents: [{
      role: "user",
      parts: parts,
    }],
    generationConfig: {
      responseModalities: ["image", "text"],
    },
  });

  const result = response.response;

  // レスポンスから画像データを抽出
  for (const candidate of result.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if (part.inlineData) {
        return Buffer.from(part.inlineData.data, "base64");
      }
    }
  }

  throw new Error("No image was generated. The API response did not contain image data.");
}
