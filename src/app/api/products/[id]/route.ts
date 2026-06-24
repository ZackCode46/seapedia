import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public: anyone can view a single product's detail with store info.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { store: { select: { id: true, name: true, description: true } } },
  });
  if (!product || !product.isActive) {
    return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ product });
}
