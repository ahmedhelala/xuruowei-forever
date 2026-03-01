import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

const ROOT = process.cwd();
const OUTPUT_PATH = path.join(ROOT, "data", "comments-dump.txt");

async function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = await readFile(filePath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['\"]|['\"]$/g, "");

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

async function loadEnv() {
  await loadEnvFile(path.join(ROOT, ".env.local"));
  await loadEnvFile(path.join(ROOT, ".env"));
}

function formatDate(value) {
  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

async function main() {
  await loadEnv();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL 未配置，无法导出留言。");
  }

  const sql = neon(databaseUrl);
  const rows = await sql`
    SELECT id, name, content, created_at
    FROM memorial_comments
    ORDER BY created_at DESC, id DESC
  `;

  const header = [
    "徐若薇纪念站 - 留言导出",
    `导出时间：${formatDate(new Date().toISOString())}`,
    `留言总数：${rows.length}`,
    "",
    "----------------------------------------",
    "",
  ];

  const body = rows.flatMap((row) => {
    const lineTitle = `#${row.id}  ${formatDate(row.created_at)}  ${row.name}`;
    const content = String(row.content ?? "").trim();

    return [lineTitle, content, "", "----------------------------------------", ""];
  });

  const output = [...header, ...body].join("\n");

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, output, "utf8");

  console.log(`Dumped ${rows.length} comments to ${path.relative(ROOT, OUTPUT_PATH)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
