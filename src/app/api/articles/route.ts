import { NextRequest, NextResponse } from "next/server";
import { categoryFromSlug } from "@/lib/categories";
import { getCurrentUserFromToken } from "@/lib/auth/session";
import {
  PAGE_SIZE,
  getCategoryPageData,
  getLatestArticles,
  normalizeWindow,
  searchArticles,
} from "@/lib/news/query";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("tinviet_session")?.value;
  const currentUser = await getCurrentUserFromToken(token);
  const { searchParams } = new URL(request.url);
  const categorySlug = searchParams.get("category") ?? "";
  const q = searchParams.get("q") ?? "";
  const sourceId = searchParams.get("source")?.trim() ?? "";
  const window = normalizeWindow(searchParams.get("window") ?? "all");
  const page = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Number.parseInt(searchParams.get("limit") ?? String(PAGE_SIZE), 10);
  const filters = {
    sourceId,
    window,
  };

  if (q.trim()) {
    const items = await searchArticles(q, Math.min(Math.max(limit, 1), 100), filters, currentUser?.id);

    return NextResponse.json({
      ok: true,
      type: "search",
      total: items.length,
      items,
    });
  }

  if (categorySlug) {
    const category = categoryFromSlug(categorySlug);

    if (!category) {
      return NextResponse.json({ ok: false, error: "Invalid category." }, { status: 400 });
    }

    const result = await getCategoryPageData(
      category,
      page,
      Math.min(Math.max(limit, 1), 50),
      filters,
    );

    return NextResponse.json({
      ok: true,
      type: "category",
      ...result,
    });
  }

  const items = await getLatestArticles(Math.min(Math.max(limit, 1), 50), filters, currentUser?.id);

  return NextResponse.json({
    ok: true,
    type: "latest",
    total: items.length,
    items,
  });
}
