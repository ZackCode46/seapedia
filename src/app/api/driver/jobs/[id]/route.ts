import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["DRIVER"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { id } = await params;
  const job = await prisma.delivery.findUnique({
    where: { id },
    include: {
      order: {
        include: {
          store: { select: { name: true } },
          address: true,
          items: { include: { product: { select: { name: true, imageUrl: true } } } },
          statusHistory: { orderBy: { createdAt: "asc" } },
        },
      },
      driver: { include: { user: { select: { name: true } } } },
    },
  });

  if (!job) return NextResponse.json({ error: "Job tidak ditemukan" }, { status: 404 });

  // A driver may view a job if it's still open, or if they're the one assigned to it.
  const isOpen = job.status === "WAITING_DRIVER" && !job.driverId;
  const isMine = job.driver?.userId === auth.user.id;
  if (!isOpen && !isMine) {
    return NextResponse.json({ error: "Job ini sudah diambil Driver lain" }, { status: 403 });
  }

  return NextResponse.json({ job });
}
