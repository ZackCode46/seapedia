import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const auth = await requireRole(["SELLER"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const store = await prisma.store.findUnique({ where: { ownerId: auth.user.id } });
  if (!store) return NextResponse.json({ orders: [] });

  const orders = await prisma.order.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
    include: {
      buyer: { select: { name: true } },
      items: { include: { product: { select: { name: true } } } },
    },
  });
  return NextResponse.json({ orders });
}
