import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// Buyer: list promos that are currently usable (active + not expired).
export async function GET() {
  const auth = await requireRole(["BUYER"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const promos = await prisma.promo.findMany({
    where: { isActive: true, expiresAt: { gt: new Date() } },
    orderBy: { discountValue: "desc" },
  });
  return NextResponse.json({ promos });
}
