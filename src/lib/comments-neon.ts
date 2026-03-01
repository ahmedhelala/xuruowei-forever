import { neon } from "@neondatabase/serverless";

export type MemorialComment = {
  id: number;
  name: string;
  content: string;
  createdAt: string;
};

function getSqlClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for comments.");
  }

  return neon(databaseUrl);
}

async function ensureCommentsTable() {
  const sql = getSqlClient();

  await sql`
    CREATE TABLE IF NOT EXISTS memorial_comments (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(40) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

function normalizeComment(row: Record<string, unknown>): MemorialComment {
  return {
    id: Number(row.id),
    name: String(row.name ?? ""),
    content: String(row.content ?? ""),
    createdAt: String(row.created_at ?? ""),
  };
}

export async function listComments(): Promise<MemorialComment[]> {
  await ensureCommentsTable();
  const sql = getSqlClient();

  const rows = await sql`
    SELECT id, name, content, created_at
    FROM memorial_comments
    ORDER BY created_at DESC, id DESC
  `;

  return rows.map((row) => normalizeComment(row as Record<string, unknown>));
}

export async function createComment(
  nameInput: string,
  contentInput: string,
): Promise<MemorialComment> {
  const name = nameInput.trim();
  const content = contentInput.trim();

  if (!name || !content) {
    throw new Error("name_and_content_required");
  }

  if (name.length > 40) {
    throw new Error("name_too_long");
  }

  if (content.length > 1000) {
    throw new Error("content_too_long");
  }

  await ensureCommentsTable();
  const sql = getSqlClient();

  const rows = await sql`
    INSERT INTO memorial_comments (name, content)
    VALUES (${name}, ${content})
    RETURNING id, name, content, created_at
  `;

  return normalizeComment(rows[0] as Record<string, unknown>);
}
