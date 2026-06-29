import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// Seller income rule (documented in README): income = subtotal - discountAmount.
// Delivery fee and PPN are NOT seller income (they go to the driver/platform/tax),
// and orders with status DIKEMBALIKAN are excluded (reversed), per the Level 6
// overdue-refund business rule.
export async function GET() {
  const auth = await requireRole(["SELLER"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const store = await prisma.store.findUnique({ where: { ownerId: auth.user.id } });
  if (!store) return NextResponse.json({ summary: null, orders: [] });

  const orders = await prisma.order.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
  });

  // Orders that were refunded/returned (Level 6) are excluded from income.
  const validOrders = orders.filter((o) => o.status !== "DIKEMBALIKAN");

  const totalIncome = validOrders.reduce((sum, o) => sum + (o.subtotal - o.discountAmount), 0);
  const totalOrders = orders.length;
  const totalProcessed = orders.filter((o) => o.status !== "SEDANG_DIKEMAS" && o.status !== "DIKEMBALIKAN").length;
  const totalReturned = orders.filter((o) => o.status === "DIKEMBALIKAN").length;

  return NextResponse.json({
    summary: { totalIncome, totalOrders, totalProcessed, totalReturned },
    orders,
  });
}
