import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  price: z.number().int().positive().optional(),
  stock: z.number().int().min(0).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

async function getOwnedProduct(productId: string, userId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { store: true },
  });
  if (!product || product.store.ownerId !== userId) return null;
  return product;
}

// Seller: update a product they own. Ownership is re-checked server-side,
// never trusted from the request body or frontend route alone.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["SELLER"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { id } = await params;
  const owned = await getOwnedProduct(id, auth.user.id);
  if (!owned) {
    return NextResponse.json({ error: "Produk tidak ditemukan atau bukan milikmu" }, { status: 404 });
  }

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Validasi gagal", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = { ...parsed.data, imageUrl: parsed.data.imageUrl || undefined };

  const product = await prisma.product.update({ where: { id }, data });
  return NextResponse.json({ message: "Produk berhasil diperbarui", product });
}

// Seller: delete a product they own.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["SELLER"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { id } = await params;
  const owned = await getOwnedProduct(id, auth.user.id);
  if (!owned) {
    return NextResponse.json({ error: "Produk tidak ditemukan atau bukan milikmu" }, { status: 404 });
  }

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ message: "Produk berhasil dihapus" });
}
