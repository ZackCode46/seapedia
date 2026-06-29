import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// Driver: confirm a job they're assigned to is complete.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["DRIVER"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { id } = await params;
  const driverProfile = await prisma.driverProfile.findUnique({ where: { userId: auth.user.id } });
  if (!driverProfile) {
    return NextResponse.json({ error: "Profil Driver tidak ditemukan" }, { status: 400 });
  }

  const job = await prisma.delivery.findUnique({ where: { id } });
  if (!job || job.driverId !== driverProfile.id) {
    return NextResponse.json({ error: "Job ini bukan milikmu" }, { status: 403 });
  }
  if (job.status !== "ON_DELIVERY") {
    return NextResponse.json({ error: `Job tidak bisa diselesaikan dari status ${job.status}` }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.delivery.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: new Date() },
    }),
    prisma.order.update({
      where: { id: job.orderId },
      data: {
        status: "PESANAN_SELESAI",
        statusHistory: { create: { status: "PESANAN_SELESAI", note: "Pesanan diterima, diantar oleh Driver" } },
      },
    }),
    prisma.driverProfile.update({
      where: { id: driverProfile.id },
      data: { totalEarning: { increment: job.earning } },
    }),
  ]);

  return NextResponse.json({ message: "Job berhasil diselesaikan", earning: job.earning });
}
