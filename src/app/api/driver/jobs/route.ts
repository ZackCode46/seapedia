import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// Driver: find available delivery jobs. Only orders that the Seller has
// already processed (MENUNGGU_PENGIRIM / Delivery.status WAITING_DRIVER) and
// that no other Driver has taken yet are shown.
export async function GET() {
  const auth = await requireRole(["DRIVER"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const jobs = await prisma.delivery.findMany({
    where: { status: "WAITING_DRIVER", driverId: null },
    orderBy: { createdAt: "asc" },
    include: {
      order: {
        include: {
          store: { select: { name: true } },
          address: { select: { city: true, fullAddress: true } },
          items: { select: { quantity: true } },
        },
      },
    },
  });

  return NextResponse.json({ jobs });
}
