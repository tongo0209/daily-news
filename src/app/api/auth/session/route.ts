import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserFromToken } from "@/lib/auth/session";

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

export async function GET(request: NextRequest) {
  const token = request.cookies.get("tinviet_session")?.value;
  const user = await getCurrentUserFromToken(token);

  if (!user) {
    return NextResponse.json({
      ok: true,
      user: null,
    });
  }

  const preference = await prisma.userPreference.findUnique({
    where: { userId: user.id },
    select: {
      preferredCategories: true,
      preferredSourceIds: true,
    },
  });

  return NextResponse.json({
    ok: true,
    user: {
      ...user,
      preferredCategories: parseStringArray(preference?.preferredCategories),
      preferredSourceIds: parseStringArray(preference?.preferredSourceIds),
    },
  });
}
