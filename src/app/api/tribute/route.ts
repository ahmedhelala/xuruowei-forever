import { NextResponse } from "next/server";
import { list, put } from "@vercel/blob";

export const dynamic = "force-dynamic";

type TributeType = "candle" | "flower";
type TributeCounts = {
  candles: number;
  flowers: number;
};

const COUNTS_PATH = "tributes/counts.json";
const EMPTY_COUNTS: TributeCounts = { candles: 0, flowers: 0 };
const hasBlobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

declare global {
  var __tributeCountsFallback: TributeCounts | undefined;
}

function getFallbackCounts(): TributeCounts {
  if (!globalThis.__tributeCountsFallback) {
    globalThis.__tributeCountsFallback = { ...EMPTY_COUNTS };
  }

  return globalThis.__tributeCountsFallback;
}

function setFallbackCounts(counts: TributeCounts): void {
  globalThis.__tributeCountsFallback = counts;
}

function normalizeCounts(data: unknown): TributeCounts {
  if (typeof data !== "object" || data === null) {
    return EMPTY_COUNTS;
  }

  const maybeCounts = data as Partial<TributeCounts>;

  return {
    candles:
      typeof maybeCounts.candles === "number" && Number.isFinite(maybeCounts.candles)
        ? maybeCounts.candles
        : 0,
    flowers:
      typeof maybeCounts.flowers === "number" && Number.isFinite(maybeCounts.flowers)
        ? maybeCounts.flowers
        : 0,
  };
}

async function getTributeCounts(): Promise<TributeCounts> {
  if (!hasBlobToken) {
    return getFallbackCounts();
  }

  const { blobs } = await list({ prefix: COUNTS_PATH, limit: 1 });
  const blob = blobs.find((item) => item.pathname === COUNTS_PATH) ?? blobs[0];

  if (!blob) {
    return EMPTY_COUNTS;
  }

  const response = await fetch(blob.url, { cache: "no-store" });
  if (!response.ok) {
    return EMPTY_COUNTS;
  }

  const data = (await response.json()) as unknown;
  return normalizeCounts(data);
}

async function setTributeCounts(counts: TributeCounts): Promise<void> {
  if (!hasBlobToken) {
    setFallbackCounts(counts);
    return;
  }

  await put(COUNTS_PATH, JSON.stringify(counts), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
  });
}

export async function GET() {
  try {
    const counts = await getTributeCounts();
    return NextResponse.json(counts);
  } catch {
    const fallback = getFallbackCounts();
    return NextResponse.json(fallback);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { type?: TributeType };

    if (body.type !== "candle" && body.type !== "flower") {
      return NextResponse.json(
        { error: "参数错误：type 必须是 candle 或 flower。" },
        { status: 400 },
      );
    }

    const current = await getTributeCounts();
    const next: TributeCounts = {
      candles: current.candles + (body.type === "candle" ? 1 : 0),
      flowers: current.flowers + (body.type === "flower" ? 1 : 0),
    };

    await setTributeCounts(next);
    return NextResponse.json(next);
  } catch {
    const fallback = getFallbackCounts();
    return NextResponse.json(fallback);
  }
}
