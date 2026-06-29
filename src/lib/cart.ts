import { prisma } from "./prisma";

/**
 * Returns the buyer's single active cart, creating one if it doesn't exist yet.
 * We treat "the buyer's cart" as the most recently created cart row, which keeps
 * the single-store checkout rule simple: storeId starts null and locks to the
 * first product's store once an item is added.
 */
export async function getOrCreateActiveCart(buyerId: string) {
  let cart = await prisma.cart.findFirst({
    where: { buyerId },
    orderBy: { createdAt: "desc" },
  });
  if (!cart) {
    cart = await prisma.cart.create({ data: { buyerId } });
  }
  return cart;
}

export async function getCartWithItems(buyerId: string) {
  const cart = await getOrCreateActiveCart(buyerId);
  const items = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    include: { product: { include: { store: { select: { id: true, name: true } } } } },
  });
  return { cart, items };
}
