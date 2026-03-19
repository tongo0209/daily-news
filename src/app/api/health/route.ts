import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const [articleCount, latestRun] = await Promise.all([
    prisma.article.count(),
    prisma.ingestionRun.findFirst({
      orderBy: { startedAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    status: "healthy",
    articleCount,
    latestRun,
    checkedAt: new Date().toISOString(),
  });
}
