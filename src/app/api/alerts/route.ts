import { subHours } from "date-fns";
import { AlertStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUserFromToken } from "@/lib/auth/session";

const createSchema = z.object({
  keyword: z.string().trim().min(2).max(80),
});

const patchSchema = z.object({
  id: z.string().min(1),
  keyword: z.string().trim().min(2).max(80).optional(),
  status: z.nativeEnum(AlertStatus).optional(),
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
  const shouldCheck = searchParams.get("check") === "1";

  const alerts = await prisma.keywordAlert.findMany({
    where: { userId: user.id },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  if (!shouldCheck) {
    return NextResponse.json({
      ok: true,
      alerts,
    });
  }

  const now = new Date();
  const checks = await Promise.all(
    alerts.map(async (alert) => {
      if (alert.status !== AlertStatus.ACTIVE) {
        return {
          alert,
          newCount: 0,
          items: [],
        };
      }

      const since = alert.lastCheckedAt ?? subHours(now, 24);
      const items = await prisma.article.findMany({
        where: {
          publishedAt: {
            gte: since,
          },
          OR: [
            {
              title: {
                contains: alert.keyword,
              },
            },
            {
              summary: {
                contains: alert.keyword,
              },
            },
          ],
        },
        orderBy: {
          publishedAt: "desc",
        },
        take: 5,
        include: {
          source: true,
        },
      });

      return {
        alert,
        newCount: items.length,
        items,
      };
    }),
  );

  await prisma.keywordAlert.updateMany({
    where: {
      userId: user.id,
      status: AlertStatus.ACTIVE,
    },
    data: {
      lastCheckedAt: now,
    },
  });

  return NextResponse.json({
    ok: true,
    checks,
    checkedAt: now.toISOString(),
  });
}

export async function POST(request: NextRequest) {
  const user = await resolveUser(request);

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = createSchema.parse(await request.json());
    const keyword = payload.keyword.trim();

    const alert = await prisma.keywordAlert.upsert({
      where: {
        userId_keyword: {
          userId: user.id,
          keyword,
        },
      },
      create: {
        userId: user.id,
        keyword,
      },
      update: {
        status: AlertStatus.ACTIVE,
      },
    });

    return NextResponse.json({
      ok: true,
      alert,
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

export async function PATCH(request: NextRequest) {
  const user = await resolveUser(request);

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = patchSchema.parse(await request.json());
    const existing = await prisma.keywordAlert.findFirst({
      where: {
        id: payload.id,
        userId: user.id,
      },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Không tìm thấy alert." }, { status: 404 });
    }

    const updated = await prisma.keywordAlert.update({
      where: { id: payload.id },
      data: {
        keyword: payload.keyword?.trim(),
        status: payload.status,
      },
    });

    return NextResponse.json({
      ok: true,
      alert: updated,
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
  const id = searchParams.get("id")?.trim();

  if (!id) {
    return NextResponse.json({ ok: false, error: "Thiếu id alert." }, { status: 400 });
  }

  await prisma.keywordAlert.deleteMany({
    where: {
      id,
      userId: user.id,
    },
  });

  return NextResponse.json({
    ok: true,
  });
}
