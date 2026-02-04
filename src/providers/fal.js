import { fal } from "@fal-ai/client";
import chalk from "chalk";

/**
 * fal.ai APIで画像を生成
 */
export async function generateWithFal(options) {
  const {
    apiKey,
    model,
    prompt,
    size,
    quality
  } = options;

  fal.config({ credentials: apiKey });

  console.log(chalk.gray(`Model: ${model}`));
  console.log(chalk.gray(`Size: ${size}`));
  console.log(chalk.gray(`Quality: ${quality}`));
  console.log(chalk.gray(`Prompt: ${prompt.substring(0, 100)}${prompt.length > 100 ? "..." : ""}`));

  console.log(chalk.cyan("\nGenerating with fal.ai..."));

  const result = await fal.subscribe(model, {
    input: {
      prompt,
      image_size: size,
      quality,
    },
  });

  // data.images配列を取得
  const images = result.data?.images || result.images;
  if (!images || images.length === 0) {
    throw new Error("No image was generated");
  }

  const imageUrl = images[0].url;

  // 画像をダウンロード
  console.log(chalk.gray("Downloading image..."));
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
