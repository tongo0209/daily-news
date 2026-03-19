import { NextRequest, NextResponse } from "next/server";
import {
  clearSessionCookie,
  destroySessionByToken,
} from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("tinviet_session")?.value;

  await destroySessionByToken(token);
  await clearSessionCookie();

  return NextResponse.json({
    ok: true,
  });
}
