import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { id } = await params;
  const promo = await prisma.promo.findUnique({
    where: { id },
    include: { orders: { select: { id: true, total: true, createdAt: true, buyer: { select: { name: true } } } } },
  });
  if (!promo) return NextResponse.json({ error: "Promo tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ promo });
}
