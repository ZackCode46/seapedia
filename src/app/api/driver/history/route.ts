import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const auth = await requireRole(["DRIVER"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const driverProfile = await prisma.driverProfile.findUnique({ where: { userId: auth.user.id } });
  if (!driverProfile) {
    return NextResponse.json({ totalEarning: 0, activeJob: null, history: [] });
  }

  const deliveries = await prisma.delivery.findMany({
    where: { driverId: driverProfile.id },
    orderBy: { createdAt: "desc" },
    include: {
      order: { include: { store: { select: { name: true } }, address: { select: { city: true } } } },
    },
  });

  const activeJob = deliveries.find((d) => d.status === "ON_DELIVERY") ?? null;
  const history = deliveries.filter((d) => d.status === "COMPLETED");

  return NextResponse.json({
    totalEarning: driverProfile.totalEarning,
    activeJob,
    history,
  });
}
