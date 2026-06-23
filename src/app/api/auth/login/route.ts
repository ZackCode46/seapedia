import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, SESSION_COOKIE, ACTIVE_ROLE_COOKIE } from "@/lib/auth";

const loginSchema = z.object({
  identifier: z.string().min(1), // username or email
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Username/email dan password wajib diisi" }, { status: 400 });
    }
    const { identifier, password } = parsed.data;

    const user = await prisma.user.findFirst({
      where: { OR: [{ username: identifier }, { email: identifier }] },
      include: { roles: true },
    });

    if (!user || !(await verifyPassword(password, user.password))) {
      return NextResponse.json({ error: "Username/email atau password salah" }, { status: 401 });
    }

    const token = signToken({ userId: user.id });
    const roles = user.roles.map((r) => r.role);

    const res = NextResponse.json({
      message: "Login berhasil",
      roles,
      needsRoleSelection: roles.length > 1, // multi non-admin role -> must pick active role
    });

    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    // If user only owns one role, auto-set it as active. Admin is treated as single-role too.
    if (roles.length === 1) {
      res.cookies.set(ACTIVE_ROLE_COOKIE, roles[0], {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    } else {
      // clear any stale active role until user explicitly picks one
      res.cookies.delete(ACTIVE_ROLE_COOKIE);
    }

    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
