import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createUserSession, hashPassword, setSessionCookie } from "@/lib/auth/session";

const payloadSchema = z.object({
  email: z.string().email().max(120),
  displayName: z.string().trim().min(2).max(80),
  password: z.string().min(8).max(128),
});

export async function POST(request: NextRequest) {
  try {
    const body = payloadSchema.parse(await request.json());
    const normalizedEmail = body.email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        {
          ok: false,
          error: "Email đã được sử dụng.",
        },
        { status: 409 },
      );
    }

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        displayName: body.displayName.trim(),
        passwordHash: hashPassword(body.password),
        preference: {
          create: {
            preferredCategories: "[]",
            preferredSourceIds: "[]",
          },
        },
      },
      select: {
        id: true,
        email: true,
        displayName: true,
      },
    });

    const token = await createUserSession(user.id);
    await setSessionCookie(token);

    return NextResponse.json({
      ok: true,
      user,
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
