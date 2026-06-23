import { NextResponse } from "next/server";
import { SESSION_COOKIE, ACTIVE_ROLE_COOKIE } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ message: "Logout berhasil" });
  // Clear both cookies so the session/token is fully invalidated client-side.
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(ACTIVE_ROLE_COOKIE);
  return res;
}
