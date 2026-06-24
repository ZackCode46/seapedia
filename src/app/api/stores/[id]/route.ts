import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public: anyone can view a store's public profile + active products.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await prisma.store.findUnique({
    where: { id },
    include: {
      products: { where: { isActive: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!store) return NextResponse.json({ error: "Toko tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ store });
}
