import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { calculateDiscountAmount } from "@/lib/orderPricing";

const schema = z.object({
  code: z.string().min(1),
  subtotal: z.number().int().nonnegative(),
});

// Buyer: validate a voucher code before checkout (preview only, doesn't
// increment usedCount — that only happens when checkout actually succeeds).
export async function POST(req: NextRequest) {
  const auth = await requireRole(["BUYER"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }
  const { code, subtotal } = parsed.data;

  const voucher = await prisma.voucher.findUnique({ where: { code: code.toUpperCase() } });
  if (!voucher) {
    return NextResponse.json({ error: "Kode voucher tidak ditemukan" }, { status: 404 });
  }
  if (voucher.expiresAt < new Date()) {
    return NextResponse.json({ error: "Voucher sudah kedaluwarsa" }, { status: 400 });
  }
  if (voucher.usedCount >= voucher.usageLimit) {
    return NextResponse.json({ error: "Kuota penggunaan voucher sudah habis" }, { status: 400 });
  }

  const discountAmount = calculateDiscountAmount(subtotal, voucher);

  return NextResponse.json({
    valid: true,
    type: "VOUCHER",
    voucher: { id: voucher.id, code: voucher.code, description: voucher.description },
    discountAmount,
  });
}
