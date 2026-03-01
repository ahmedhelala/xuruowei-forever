import { neon } from "@neondatabase/serverless";

export type TributeType = "candle" | "flower";

export type TributeCounts = {
  candles: number;
  flowers: number;
};

const EMPTY_COUNTS: TributeCounts = { candles: 0, flowers: 0 };

function getSqlClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for tribute counter.");
  }

  return neon(databaseUrl);
}

async function ensureTable() {
  const sql = getSqlClient();

  await sql`
    CREATE TABLE IF NOT EXISTS tribute_counts (
      id SMALLINT PRIMARY KEY,
      candles INTEGER NOT NULL DEFAULT 0,
      flowers INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

function normalizeRow(row: Record<string, unknown> | undefined): TributeCounts {
  if (!row) {
    return EMPTY_COUNTS;
  }

  return {
    candles: Number(row.candles ?? 0),
    flowers: Number(row.flowers ?? 0),
  };
}

export async function getTributeCounts(): Promise<TributeCounts> {
  await ensureTable();

  const sql = getSqlClient();

  const rows = await sql`
    SELECT candles, flowers
    FROM tribute_counts
    WHERE id = 1
    LIMIT 1
  `;

  return normalizeRow(rows[0] as Record<string, unknown> | undefined);
}

export async function increaseTribute(type: TributeType): Promise<TributeCounts> {
  await ensureTable();

  const sql = getSqlClient();

  const candleInc = type === "candle" ? 1 : 0;
  const flowerInc = type === "flower" ? 1 : 0;

  const rows = await sql`
    INSERT INTO tribute_counts (id, candles, flowers)
    VALUES (1, ${candleInc}, ${flowerInc})
    ON CONFLICT (id)
    DO UPDATE SET
      candles = tribute_counts.candles + EXCLUDED.candles,
      flowers = tribute_counts.flowers + EXCLUDED.flowers,
      updated_at = NOW()
    RETURNING candles, flowers
  `;

  return normalizeRow(rows[0] as Record<string, unknown> | undefined);
}
