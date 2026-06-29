import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { getOrCreateActiveCart } from "@/lib/cart";
import { calculateOrderTotals, calculateDiscountAmount } from "@/lib/orderPricing";
import { DeliveryMethod } from "@prisma/client";

const checkoutSchema = z.object({
  addressId: z.string().min(1),
  deliveryMethod: z.enum(["INSTANT", "NEXT_DAY", "REGULAR"]),
  voucherCode: z.string().optional(),
  promoId: z.string().optional(),
});

// Buyer: checkout the active cart into an Order.
// Runs as a single DB transaction so stock reduction, wallet debit, and order
// creation either all succeed or all roll back together.
export async function POST(req: NextRequest) {
  const auth = await requireRole(["BUYER"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const parsed = checkoutSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Validasi gagal", details: parsed.error.flatten() }, { status: 400 });
  }
  const { addressId, deliveryMethod, voucherCode, promoId } = parsed.data;

  try {
    const order = await prisma.$transaction(async (tx) => {
      const cart = await getOrCreateActiveCart(auth.user.id);
      const items = await tx.cartItem.findMany({
        where: { cartId: cart.id },
        include: { product: true },
      });

      if (items.length === 0 || !cart.storeId) {
        throw new CheckoutError("Keranjang kamu kosong", 400);
      }

      const address = await tx.address.findUnique({ where: { id: addressId } });
      if (!address || address.userId !== auth.user.id) {
        throw new CheckoutError("Alamat pengiriman tidak valid", 400);
      }

      // Re-check stock freshly inside the transaction to avoid race conditions
      // between two simultaneous checkouts.
      for (const item of items) {
        const freshProduct = await tx.product.findUnique({ where: { id: item.productId } });
        if (!freshProduct || !freshProduct.isActive) {
          throw new CheckoutError(`Produk ${item.product.name} tidak lagi tersedia`, 400);
        }
        if (freshProduct.stock < item.quantity) {
          throw new CheckoutError(
            `Stok ${freshProduct.name} tidak cukup. Tersisa ${freshProduct.stock}`,
            400
          );
        }
      }

      const subtotal = items.reduce((sum, it) => sum + it.product.price * it.quantity, 0);

      // Voucher and Promo CAN be combined (business rule documented in README).
      // Both are re-validated here, inside the transaction, to prevent two
      // concurrent checkouts from both consuming the last unit of a voucher.
      let discountAmount = 0;
      let appliedVoucherId: string | null = null;
      let appliedPromoId: string | null = null;

      if (voucherCode) {
        const voucher = await tx.voucher.findUnique({ where: { code: voucherCode.toUpperCase() } });
        if (!voucher) throw new CheckoutError("Kode voucher tidak ditemukan", 400);
        if (voucher.expiresAt < new Date()) throw new CheckoutError("Voucher sudah kedaluwarsa", 400);
        if (voucher.usedCount >= voucher.usageLimit) {
          throw new CheckoutError("Kuota penggunaan voucher sudah habis", 400);
        }
        discountAmount += calculateDiscountAmount(subtotal, voucher);
        appliedVoucherId = voucher.id;
      }

      if (promoId) {
        const promo = await tx.promo.findUnique({ where: { id: promoId } });
        if (!promo) throw new CheckoutError("Promo tidak ditemukan", 400);
        if (!promo.isActive) throw new CheckoutError("Promo tidak aktif", 400);
        if (promo.expiresAt < new Date()) throw new CheckoutError("Promo sudah kedaluwarsa", 400);
        discountAmount += calculateDiscountAmount(subtotal, promo);
        appliedPromoId = promo.id;
      }

      // Cap combined discount at subtotal so total never goes negative.
      discountAmount = Math.min(discountAmount, subtotal);

      const { deliveryFee, ppn, total } = calculateOrderTotals({
        subtotal,
        discountAmount,
        deliveryMethod: deliveryMethod as DeliveryMethod,
      });

      const wallet = await tx.wallet.findUnique({ where: { userId: auth.user.id } });
      if (!wallet || wallet.balance < total) {
        throw new CheckoutError("Saldo wallet tidak cukup untuk menyelesaikan checkout", 400);
      }

      // Reduce stock per item, guarded so it can never go negative.
      for (const item of items) {
        const updateResult = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updateResult.count === 0) {
          throw new CheckoutError(`Stok ${item.product.name} tidak cukup`, 400);
        }
      }

      const createdOrder = await tx.order.create({
        data: {
          buyerId: auth.user.id,
          storeId: cart.storeId,
          addressId,
          deliveryMethod: deliveryMethod as DeliveryMethod,
          status: "SEDANG_DIKEMAS",
          subtotal,
          discountAmount,
          deliveryFee,
          ppn,
          total,
          voucherId: appliedVoucherId,
          promoId: appliedPromoId,
          items: {
            create: items.map((it) => ({
              productId: it.productId,
              quantity: it.quantity,
              priceEach: it.product.price,
            })),
          },
          statusHistory: {
            create: { status: "SEDANG_DIKEMAS", note: "Pesanan dibuat" },
          },
        },
      });

      if (appliedVoucherId) {
        await tx.voucher.update({ where: { id: appliedVoucherId }, data: { usedCount: { increment: 1 } } });
      }

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: total } },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "CHECKOUT_PAYMENT",
          amount: -total,
          note: `Pembayaran order #${createdOrder.id}`,
          orderId: createdOrder.id,
        },
      });

      // Clear the cart and release the single-store lock.
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({ where: { id: cart.id }, data: { storeId: null } });

      return createdOrder;
    });

    return NextResponse.json({ message: "Checkout berhasil", order });
  } catch (err) {
    if (err instanceof CheckoutError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Terjadi kesalahan server saat checkout" }, { status: 500 });
  }
}

class CheckoutError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
