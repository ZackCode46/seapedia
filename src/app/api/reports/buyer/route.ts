import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const auth = await requireRole(["BUYER"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const orders = await prisma.order.findMany({
    where: { buyerId: auth.user.id },
    orderBy: { createdAt: "desc" },
  });

  // Refunded/returned orders are excluded from the "completed spending" total,
  // but still listed below for transparency.
  const validOrders = orders.filter((o) => o.status !== "DIKEMBALIKAN");

  const totalSpent = validOrders.reduce((sum, o) => sum + o.total, 0);
  const totalDiscount = validOrders.reduce((sum, o) => sum + o.discountAmount, 0);
  const totalOrders = orders.length;
  const totalCompleted = orders.filter((o) => o.status === "PESANAN_SELESAI").length;
  const totalReturned = orders.filter((o) => o.status === "DIKEMBALIKAN").length;

  return NextResponse.json({
    summary: { totalSpent, totalDiscount, totalOrders, totalCompleted, totalReturned },
    orders,
  });
}
