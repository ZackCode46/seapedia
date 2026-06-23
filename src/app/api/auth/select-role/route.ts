import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, ACTIVE_ROLE_COOKIE } from "@/lib/auth";

const schema = z.object({
  role: z.enum(["ADMIN", "SELLER", "BUYER", "DRIVER"]),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
  }

  const { role } = parsed.data;
  const owned = user.roles.some((r) => r.role === role);
  if (!owned) {
    return NextResponse.json({ error: "Kamu tidak memiliki role ini" }, { status: 403 });
  }

  const res = NextResponse.json({ message: "Role aktif diperbarui", activeRole: role });
  res.cookies.set(ACTIVE_ROLE_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}
