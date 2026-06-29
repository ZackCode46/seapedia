import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { calculateDriverEarning } from "@/lib/orderPricing";

// Seller: move their own order from SEDANG_DIKEMAS to MENUNGGU_PENGIRIM.
// This also creates the Delivery job row that makes the order visible to
// Drivers in the job board — an order cannot become available to Drivers
// before this step.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["SELLER"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { store: true } });

  if (!order || order.store.ownerId !== auth.user.id) {
    return NextResponse.json({ error: "Order tidak ditemukan atau bukan milik tokomu" }, { status: 404 });
  }
  if (order.status !== "SEDANG_DIKEMAS") {
    return NextResponse.json(
      { error: `Order tidak bisa diproses dari status ${order.status}` },
      { status: 400 }
    );
  }

  const earning = calculateDriverEarning(order.deliveryFee);

  const updated = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id },
      data: {
        status: "MENUNGGU_PENGIRIM",
        statusHistory: {
          create: { status: "MENUNGGU_PENGIRIM", note: "Diproses oleh Seller, siap diambil Driver" },
        },
      },
    });
    await tx.delivery.upsert({
      where: { orderId: id },
      update: { status: "WAITING_DRIVER", earning },
      create: { orderId: id, status: "WAITING_DRIVER", earning },
    });
    return updatedOrder;
  });

  return NextResponse.json({ message: "Order berhasil diproses, menunggu Driver", order: updated });
}
