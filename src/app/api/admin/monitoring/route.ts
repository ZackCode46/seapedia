import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { getSystemNow } from "@/lib/systemClock";
import { DELIVERY_SLA_HOURS } from "@/lib/orderPricing";

export async function GET() {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const now = await getSystemNow();

  const [
    totalUsers,
    roleBreakdown,
    totalStores,
    totalProducts,
    totalOrders,
    orderByStatus,
    allVouchers,
    totalPromos,
    activePromos,
    waitingDeliveries,
    onDeliveryCount,
    completedDeliveries,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.userRole.groupBy({ by: ["role"], _count: true }),
    prisma.store.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.groupBy({ by: ["status"], _count: true }),
    prisma.voucher.findMany({ select: { expiresAt: true, usedCount: true, usageLimit: true } }),
    prisma.promo.count(),
    prisma.promo.count({ where: { isActive: true, expiresAt: { gt: now } } }),
    prisma.delivery.count({ where: { status: "WAITING_DRIVER" } }),
    prisma.delivery.count({ where: { status: "ON_DELIVERY" } }),
    prisma.delivery.count({ where: { status: "COMPLETED" } }),
  ]);

  const totalVouchers = allVouchers.length;
  const activeVouchers = allVouchers.filter((v) => v.expiresAt > now && v.usedCount < v.usageLimit).length;

  // Overdue orders: same eligibility logic as the actual job, computed here read-only for display.
  const candidates = await prisma.order.findMany({
    where: { status: { in: ["SEDANG_DIKEMAS", "MENUNGGU_PENGIRIM", "SEDANG_DIKIRIM"] }, refunded: false },
    select: { id: true, createdAt: true, deliveryMethod: true },
  });
  const overdueCount = candidates.filter((o) => {
    const slaHours = DELIVERY_SLA_HOURS[o.deliveryMethod];
    const deadline = new Date(o.createdAt.getTime() + slaHours * 60 * 60 * 1000);
    return now > deadline;
  }).length;

  const returnedCount = await prisma.order.count({ where: { status: "DIKEMBALIKAN" } });

  return NextResponse.json({
    simulatedNow: now,
    users: { total: totalUsers, byRole: roleBreakdown },
    stores: { total: totalStores },
    products: { total: totalProducts },
    orders: { total: totalOrders, byStatus: orderByStatus },
    vouchers: { total: totalVouchers, active: activeVouchers },
    promos: { total: totalPromos, active: activePromos },
    deliveries: { waiting: waitingDeliveries, onDelivery: onDeliveryCount, completed: completedDeliveries },
    overdue: { pendingCount: overdueCount, returnedCount },
  });
}
