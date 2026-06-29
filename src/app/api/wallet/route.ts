import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// Buyer: get wallet balance and transaction history.
export async function GET() {
  const auth = await requireRole(["BUYER"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const wallet = await prisma.wallet.findUnique({
    where: { userId: auth.user.id },
    include: { transactions: { orderBy: { createdAt: "desc" }, take: 50 } },
  });
  return NextResponse.json({ wallet });
}

const topupSchema = z.object({
  amount: z.number().int().positive().max(50_000_000),
});

// Buyer: dummy top-up (no real payment gateway, as allowed by the challenge spec).
export async function POST(req: NextRequest) {
  const auth = await requireRole(["BUYER"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const parsed = topupSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Jumlah top-up tidak valid" }, { status: 400 });
  }

  const wallet = await prisma.wallet.upsert({
    where: { userId: auth.user.id },
    update: {},
    create: { userId: auth.user.id, balance: 0 },
  });

  const [updatedWallet] = await prisma.$transaction([
    prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: parsed.data.amount } },
    }),
    prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "TOPUP",
        amount: parsed.data.amount,
        note: "Dummy top-up",
      },
    }),
  ]);

  return NextResponse.json({ message: "Top-up berhasil", wallet: updatedWallet });
}
