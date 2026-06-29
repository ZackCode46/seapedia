import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { getOrCreateActiveCart } from "@/lib/cart";

const updateSchema = z.object({ quantity: z.number().int().positive() });

// Buyer: update quantity of a cart item they own.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["BUYER"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { id } = await params;
  const cart = await getOrCreateActiveCart(auth.user.id);

  const item = await prisma.cartItem.findUnique({ where: { id }, include: { product: true } });
  if (!item || item.cartId !== cart.id) {
    return NextResponse.json({ error: "Item keranjang tidak ditemukan" }, { status: 404 });
  }

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Kuantitas tidak valid" }, { status: 400 });
  }

  if (parsed.data.quantity > item.product.stock) {
    return NextResponse.json(
      { error: `Stok tidak cukup. Stok tersedia: ${item.product.stock}` },
      { status: 400 }
    );
  }

  await prisma.cartItem.update({ where: { id }, data: { quantity: parsed.data.quantity } });
  return NextResponse.json({ message: "Kuantitas berhasil diperbarui" });
}

// Buyer: remove a single item from cart. If the cart becomes empty, unlock the store.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["BUYER"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { id } = await params;
  const cart = await getOrCreateActiveCart(auth.user.id);

  const item = await prisma.cartItem.findUnique({ where: { id } });
  if (!item || item.cartId !== cart.id) {
    return NextResponse.json({ error: "Item keranjang tidak ditemukan" }, { status: 404 });
  }

  await prisma.cartItem.delete({ where: { id } });

  const remaining = await prisma.cartItem.count({ where: { cartId: cart.id } });
  if (remaining === 0) {
    await prisma.cart.update({ where: { id: cart.id }, data: { storeId: null } });
  }

  return NextResponse.json({ message: "Item berhasil dihapus dari keranjang" });
}
