import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const productSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  price: z.number().int().positive(),
  stock: z.number().int().min(0),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

// Seller: list products they own.
export async function GET() {
  const auth = await requireRole(["SELLER"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const store = await prisma.store.findUnique({ where: { ownerId: auth.user.id } });
  if (!store) return NextResponse.json({ products: [] });

  const products = await prisma.product.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ products });
}

// Seller: create a new product under their own store.
export async function POST(req: NextRequest) {
  const auth = await requireRole(["SELLER"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const store = await prisma.store.findUnique({ where: { ownerId: auth.user.id } });
  if (!store) {
    return NextResponse.json({ error: "Buat toko terlebih dahulu sebelum menambah produk" }, { status: 400 });
  }

  const parsed = productSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Validasi gagal", details: parsed.error.flatten() }, { status: 400 });
  }
  const { name, description, price, stock, imageUrl } = parsed.data;

  const product = await prisma.product.create({
    data: { storeId: store.id, name, description, price, stock, imageUrl: imageUrl || null },
  });

  return NextResponse.json({ message: "Produk berhasil dibuat", product });
}
