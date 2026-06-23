import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { RoleName } from "@prisma/client";

const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, underscore"),
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  phone: z.string().optional(),
  // A non-admin user may register with one or more of these roles at once.
  roles: z.array(z.enum(["SELLER", "BUYER", "DRIVER"])).min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { username, email, password, name, phone, roles } = parsed.data;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Username atau email sudah terdaftar" },
        { status: 409 }
      );
    }

    const hashed = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashed,
        name,
        phone,
        roles: {
          create: roles.map((r) => ({ role: r as RoleName })),
        },
        wallet: { create: { balance: 0 } },
      },
      include: { roles: true },
    });

    return NextResponse.json({
      message: "Registrasi berhasil",
      user: { id: user.id, username: user.username, roles: user.roles.map((r) => r.role) },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
