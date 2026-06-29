import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const voucherSchema = z.object({
  code: z.string().min(3).max(30).regex(/^[A-Z0-9_-]+$/, "Kode hanya huruf besar, angka, - dan _"),
  description: z.string().max(200).optional(),
  discountType: z.enum(["PERCENTAGE", "FLAT"]),
  discountValue: z.number().int().positive(),
  maxDiscount: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().or(z.string().min(1)),
  usageLimit: z.number().int().positive(),
});

export async function GET() {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const vouchers = await prisma.voucher.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ vouchers });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const parsed = voucherSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Validasi gagal", details: parsed.error.flatten() }, { status: 400 });
  }
  const { code, description, discountType, discountValue, maxDiscount, expiresAt, usageLimit } = parsed.data;

  const existing = await prisma.voucher.findUnique({ where: { code } });
  if (existing) {
    return NextResponse.json({ error: "Kode voucher sudah digunakan" }, { status: 409 });
  }

  const voucher = await prisma.voucher.create({
    data: {
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      maxDiscount,
      expiresAt: new Date(expiresAt),
      usageLimit,
    },
  });
  return NextResponse.json({ message: "Voucher berhasil dibuat", voucher });
}
