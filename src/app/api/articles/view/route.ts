import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUserFromToken } from "@/lib/auth/session";

const payloadSchema = z.object({
  slug: z.string().trim().min(1),
});

export async function POST(request: NextRequest) {
  const token = request.cookies.get("tinviet_session")?.value;
  const user = await getCurrentUserFromToken(token);

  if (!user) {
    return NextResponse.json({ ok: true, tracked: false });
  }

  try {
    const payload = payloadSchema.parse(await request.json());
    const article = await prisma.article.findUnique({
      where: { slug: payload.slug },
      select: { id: true },
    });

    if (!article) {
      return NextResponse.json({ ok: false, error: "Không tìm thấy bài viết." }, { status: 404 });
    }

    await prisma.articleView.create({
      data: {
        userId: user.id,
        articleId: article.id,
      },
    });

    return NextResponse.json({
      ok: true,
      tracked: true,
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
