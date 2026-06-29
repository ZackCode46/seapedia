import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { getOrCreateActiveCart, getCartWithItems } from "@/lib/cart";

// Buyer: get current cart summary (items + computed subtotal).
export async function GET() {
  const auth = await requireRole(["BUYER"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { cart, items } = await getCartWithItems(auth.user.id);
  const subtotal = items.reduce((sum, it) => sum + it.product.price * it.quantity, 0);

  return NextResponse.json({ cart, items, subtotal });
}

const addSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().default(1),
});

// Buyer: add a product to cart. Enforces single-store checkout rule —
// a cart locked to Store A rejects products from Store B until cleared.
export async function POST(req: NextRequest) {
  const auth = await requireRole(["BUYER"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const parsed = addSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Validasi gagal", details: parsed.error.flatten() }, { status: 400 });
  }
  const { productId, quantity } = parsed.data;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) {
    return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
  }

  const cart = await getOrCreateActiveCart(auth.user.id);

  if (cart.storeId && cart.storeId !== product.storeId) {
    return NextResponse.json(
      {
        error:
          "Keranjang kamu berisi produk dari toko lain. SEAPEDIA hanya mendukung checkout satu toko per transaksi — kosongkan keranjang dulu untuk belanja dari toko ini.",
        code: "SINGLE_STORE_CONFLICT",
      },
      { status: 409 }
    );
  }

  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });
  const desiredQty = (existingItem?.quantity ?? 0) + quantity;
  if (desiredQty > product.stock) {
    return NextResponse.json(
      { error: `Stok tidak cukup. Stok tersedia: ${product.stock}` },
      { status: 400 }
    );
  }

  await prisma.$transaction([
    prisma.cart.update({ where: { id: cart.id }, data: { storeId: product.storeId } }),
    prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      update: { quantity: desiredQty },
      create: { cartId: cart.id, productId, quantity },
    }),
  ]);

  return NextResponse.json({ message: "Produk ditambahkan ke keranjang" });
}

// Buyer: clear the entire cart (used to resolve single-store conflicts).
export async function DELETE() {
  const auth = await requireRole(["BUYER"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const cart = await getOrCreateActiveCart(auth.user.id);
  await prisma.$transaction([
    prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
    prisma.cart.update({ where: { id: cart.id }, data: { storeId: null } }),
  ]);
  return NextResponse.json({ message: "Keranjang berhasil dikosongkan" });
}
