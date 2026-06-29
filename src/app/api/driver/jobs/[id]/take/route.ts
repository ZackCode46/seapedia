import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// Driver: take an available job. Uses an atomic conditional update
// (driverId: null AND status: WAITING_DRIVER) so that if two Drivers click
// "take" on the same job at nearly the same time, only one update succeeds —
// the second one gets count: 0 and a clear "already taken" error.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["DRIVER"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { id } = await params;

  const driverProfile = await prisma.driverProfile.findUnique({ where: { userId: auth.user.id } });
  if (!driverProfile) {
    return NextResponse.json({ error: "Profil Driver tidak ditemukan" }, { status: 400 });
  }

  const job = await prisma.delivery.findUnique({ where: { id } });
  if (!job) return NextResponse.json({ error: "Job tidak ditemukan" }, { status: 404 });

  try {
    await prisma.$transaction(async (tx) => {
      const result = await tx.delivery.updateMany({
        where: { id, status: "WAITING_DRIVER", driverId: null },
        data: { driverId: driverProfile.id, status: "ON_DELIVERY", takenAt: new Date() },
      });
      if (result.count === 0) {
        throw new Error("TAKEN");
      }
      await tx.order.update({
        where: { id: job.orderId },
        data: {
          status: "SEDANG_DIKIRIM",
          statusHistory: { create: { status: "SEDANG_DIKIRIM", note: "Diambil oleh Driver, dalam pengantaran" } },
        },
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "TAKEN") {
      return NextResponse.json({ error: "Job ini sudah diambil Driver lain" }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }

  return NextResponse.json({ message: "Job berhasil diambil" });
}
