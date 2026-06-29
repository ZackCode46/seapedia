import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const promoSchema = z.object({
  name: z.string().min(3).max(50),
  discountType: z.enum(["PERCENTAGE", "FLAT"]),
  discountValue: z.number().int().positive(),
  maxDiscount: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().or(z.string().min(1)),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const promos = await prisma.promo.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ promos });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const parsed = promoSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Validasi gagal", details: parsed.error.flatten() }, { status: 400 });
  }
  const { name, discountType, discountValue, maxDiscount, expiresAt, isActive } = parsed.data;

  const promo = await prisma.promo.create({
    data: {
      name,
      discountType,
      discountValue,
      maxDiscount,
      expiresAt: new Date(expiresAt),
      isActive: isActive ?? true,
    },
  });
  return NextResponse.json({ message: "Promo berhasil dibuat", promo });
}
