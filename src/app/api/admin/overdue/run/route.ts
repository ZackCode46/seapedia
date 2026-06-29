import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { getSystemNow } from "@/lib/systemClock";
import { DELIVERY_SLA_HOURS } from "@/lib/orderPricing";

/**
 * Admin: scan all non-final orders and auto-refund/return any that have
 * exceeded their delivery-method SLA, based on the simulated system clock.
 *
 * SLA is measured from Order.createdAt (documented in README) — simple and
 * predictable rather than depending on which intermediate status the order
 * happens to be sitting in.
 *
 * Each order is processed in its own transaction so one failure doesn't
 * block the rest of the batch, and double-refund/double-restore is
 * prevented by re-checking `refunded === false` and the order's current
 * status fresh inside that transaction (not just from the initial scan).
 */
export async function POST() {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const now = await getSystemNow();

  const candidates = await prisma.order.findMany({
    where: {
      status: { in: ["SEDANG_DIKEMAS", "MENUNGGU_PENGIRIM", "SEDANG_DIKIRIM"] },
      refunded: false,
    },
    include: { items: true },
  });

  const overdueIds = candidates.filter((o) => {
    const slaHours = DELIVERY_SLA_HOURS[o.deliveryMethod];
    const deadline = new Date(o.createdAt.getTime() + slaHours * 60 * 60 * 1000);
    return now > deadline;
  });

  const results: { orderId: string; refundedAmount: number }[] = [];

  for (const order of overdueIds) {
    try {
      await prisma.$transaction(async (tx) => {
        const fresh = await tx.order.findUnique({ where: { id: order.id } });
        if (!fresh || fresh.refunded || fresh.status === "PESANAN_SELESAI" || fresh.status === "DIKEMBALIKAN") {
          return; // already handled by a previous run — skip silently
        }

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: "DIKEMBALIKAN",
            refunded: true,
            stockRestored: true,
            sellerIncomeReversed: true,
            statusHistory: {
              create: {
                status: "DIKEMBALIKAN",
                note: `Auto-refund: melebihi SLA pengiriman (${DELIVERY_SLA_HOURS[order.deliveryMethod]} jam) untuk metode ${order.deliveryMethod}`,
              },
            },
          },
        });

        // Restore stock for each item.
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }

        // Refund buyer wallet and record the transaction.
        const wallet = await tx.wallet.findUnique({ where: { userId: order.buyerId } });
        if (wallet) {
          await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: order.total } } });
          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: "REFUND",
              amount: order.total,
              note: `Refund otomatis order #${order.id} (overdue)`,
              orderId: order.id,
            },
          });
        }
      });

      results.push({ orderId: order.id, refundedAmount: order.total });
    } catch (err) {
      console.error(`Gagal memproses overdue untuk order ${order.id}:`, err);
    }
  }

  return NextResponse.json({
    message: `${results.length} order overdue berhasil diproses`,
    simulatedNow: now,
    results,
  });
}
