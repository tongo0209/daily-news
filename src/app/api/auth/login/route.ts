import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  createUserSession,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth/session";

const payloadSchema = z.object({
  email: z.string().email().max(120),
  password: z.string().min(1).max(128),
});

export async function POST(request: NextRequest) {
  try {
    const body = payloadSchema.parse(await request.json());
    const normalizedEmail = body.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        displayName: true,
        passwordHash: true,
      },
    });

    if (!user || !verifyPassword(body.password, user.passwordHash)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Email hoặc mật khẩu không đúng.",
        },
        { status: 401 },
      );
    }

    const token = await createUserSession(user.id);
    await setSessionCookie(token);

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
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
