import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public: guests and logged-in users can list active products with store info.
export async function GET() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    include: { store: { select: { id: true, name: true } } },
  });
  return NextResponse.json({ products });
}
