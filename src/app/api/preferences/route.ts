import { Category } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUserFromToken } from "@/lib/auth/session";

const patchSchema = z.object({
  preferredCategories: z.array(z.nativeEnum(Category)).max(7).optional(),
  preferredSourceIds: z.array(z.string().trim().min(1)).max(30).optional(),
});

function parseStringArray(raw: string | null | undefined): string[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

async function resolveUser(request: NextRequest) {
  const token = request.cookies.get("tinviet_session")?.value;
  return getCurrentUserFromToken(token);
}

export async function GET(request: NextRequest) {
  const user = await resolveUser(request);

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const preference = await prisma.userPreference.findUnique({
    where: { userId: user.id },
    select: {
      preferredCategories: true,
      preferredSourceIds: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    preference: {
      preferredCategories: parseStringArray(preference?.preferredCategories),
      preferredSourceIds: parseStringArray(preference?.preferredSourceIds),
      updatedAt: preference?.updatedAt ?? null,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const user = await resolveUser(request);

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = patchSchema.parse(await request.json());

    const updated = await prisma.userPreference.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        preferredCategories: JSON.stringify(payload.preferredCategories ?? []),
        preferredSourceIds: JSON.stringify(payload.preferredSourceIds ?? []),
      },
      update: {
        preferredCategories:
          payload.preferredCategories !== undefined
            ? JSON.stringify(payload.preferredCategories)
            : undefined,
        preferredSourceIds:
          payload.preferredSourceIds !== undefined
            ? JSON.stringify(payload.preferredSourceIds)
            : undefined,
      },
    });

    return NextResponse.json({
      ok: true,
      preference: {
        preferredCategories: parseStringArray(updated.preferredCategories),
        preferredSourceIds: parseStringArray(updated.preferredSourceIds),
        updatedAt: updated.updatedAt,
      },
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
