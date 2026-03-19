import { NextRequest, NextResponse } from "next/server";
import { runIngestion } from "@/lib/news/ingest";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const expectedToken = process.env.INGEST_TOKEN?.trim();

  if (!expectedToken) {
    return true;
  }

  const headerToken = request.headers.get("x-ingest-token")?.trim();

  return headerToken === expectedToken;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Use POST /api/ingest to trigger ingestion.",
  });
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized",
      },
      { status: 401 },
    );
  }

  try {
    const result = await runIngestion();

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
