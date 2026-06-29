import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getActiveRole } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Belum login" }, { status: 401 });
  const activeRole = await getActiveRole();

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { name: true, imageUrl: true } } } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      store: { select: { id: true, name: true, ownerId: true } },
      address: true,
      delivery: { include: { driver: { include: { user: { select: { name: true } } } } } },
    },
  });
  if (!order) return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });

  const isOwningBuyer = activeRole === "BUYER" && order.buyerId === user.id;
  const isOwningSeller = activeRole === "SELLER" && order.store.ownerId === user.id;
  const isDeliveringDriver =
    activeRole === "DRIVER" && order.delivery?.driver?.userId === user.id;

  if (!isOwningBuyer && !isOwningSeller && !isDeliveringDriver) {
    return NextResponse.json({ error: "Kamu tidak berhak melihat order ini" }, { status: 403 });
  }

  return NextResponse.json({ order });
}
