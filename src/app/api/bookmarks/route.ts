import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUserFromToken } from "@/lib/auth/session";

const payloadSchema = z.object({
  slug: z.string().min(1),
  action: z.enum(["save", "remove"]).optional(),
});

async function resolveUser(request: NextRequest) {
  const token = request.cookies.get("tinviet_session")?.value;
  return getCurrentUserFromToken(token);
}

export async function GET(request: NextRequest) {
  const user = await resolveUser(request);

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug")?.trim();

  if (slug) {
    const item = await prisma.savedArticle.findFirst({
      where: {
        userId: user.id,
        article: {
          slug,
        },
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({
      ok: true,
      saved: Boolean(item),
    });
  }

  const items = await prisma.savedArticle.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      article: {
        include: {
          source: true,
        },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    items,
  });
}

export async function POST(request: NextRequest) {
  const user = await resolveUser(request);

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = payloadSchema.parse(await request.json());
    const article = await prisma.article.findUnique({
      where: { slug: payload.slug.trim() },
      select: {
        id: true,
      },
    });

    if (!article) {
      return NextResponse.json({ ok: false, error: "Không tìm thấy bài viết." }, { status: 404 });
    }

    const existing = await prisma.savedArticle.findUnique({
      where: {
        userId_articleId: {
          userId: user.id,
          articleId: article.id,
        },
      },
      select: {
        id: true,
      },
    });

    const action = payload.action ?? (existing ? "remove" : "save");

    if (action === "save" && !existing) {
      await prisma.savedArticle.create({
        data: {
          userId: user.id,
          articleId: article.id,
        },
      });
    }

    if (action === "remove" && existing) {
      await prisma.savedArticle.delete({
        where: { id: existing.id },
      });
    }

    return NextResponse.json({
      ok: true,
      saved: action === "save",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: error.issues[0]?.message ?? "Dữ liệu không hợp lệ.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: (error as Error).message,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const user = await resolveUser(request);

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug")?.trim();

  if (slug) {
    await prisma.savedArticle.deleteMany({
      where: {
        userId: user.id,
        article: {
          slug,
        },
      },
    });
  } else {
    await prisma.savedArticle.deleteMany({
      where: {
        userId: user.id,
      },
    });
  }

  return NextResponse.json({
    ok: true,
  });
}
