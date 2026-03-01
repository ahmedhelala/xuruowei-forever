import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, "public");
const OUTPUT_DIR = path.join(PUBLIC_DIR, "optimized");
const SUPPORTED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

const quality = Number(process.env.IMAGE_QUALITY ?? 68);
const maxWidth = Number(process.env.IMAGE_MAX_WIDTH ?? 1600);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (fullPath.startsWith(OUTPUT_DIR)) {
          return [];
        }

        return walk(fullPath);
      }

      return [fullPath];
    }),
  );

  return files.flat();
}

function toOutputPath(inputPath) {
  const relative = path.relative(PUBLIC_DIR, inputPath);
  const parsed = path.parse(relative);
  return path.join(OUTPUT_DIR, parsed.dir, `${parsed.name}.webp`);
}

async function optimizeOne(inputPath) {
  const outputPath = toOutputPath(inputPath);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  await sharp(inputPath)
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality })
    .toFile(outputPath);

  const inputStat = await fs.stat(inputPath);
  const outputStat = await fs.stat(outputPath);

  const saved = inputStat.size - outputStat.size;
  const savedKB = (saved / 1024).toFixed(1);

  console.log(`optimized: ${path.relative(PUBLIC_DIR, inputPath)} -> optimized/${path.relative(OUTPUT_DIR, outputPath)} (${savedKB} KB saved)`);
}

async function main() {
  const allFiles = await walk(PUBLIC_DIR);
  const targetFiles = allFiles.filter((file) => SUPPORTED_EXT.has(path.extname(file).toLowerCase()));

  if (targetFiles.length === 0) {
    console.log("No images found in public directory.");
    return;
  }

  for (const file of targetFiles) {
    await optimizeOne(file);
  }

  console.log(`Done. Optimized ${targetFiles.length} image(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
