import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const auth = await requireRole(["BUYER"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const orders = await prisma.order.findMany({
    where: { buyerId: auth.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      store: { select: { name: true } },
      items: { include: { product: { select: { name: true, imageUrl: true } } } },
    },
  });
  return NextResponse.json({ orders });
}
