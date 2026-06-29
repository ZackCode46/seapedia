import { DeliveryMethod } from "@prisma/client";

// Flat delivery fee per method, documented in README. Kept simple and explicit
// rather than distance-based, since the challenge doesn't require geolocation.
export const DELIVERY_FEES: Record<DeliveryMethod, number> = {
  INSTANT: 20000,
  NEXT_DAY: 12000,
  REGULAR: 7000,
};

// SLA in hours, used by the Level 6 overdue auto-refund/return job.
export const DELIVERY_SLA_HOURS: Record<DeliveryMethod, number> = {
  INSTANT: 3,
  NEXT_DAY: 24,
  REGULAR: 72,
};

export const PPN_RATE = 0.12;

export type DiscountInput = {
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  maxDiscount: number | null;
};

/**
 * Computes the rupiah amount for a single discount (Voucher or Promo) against
 * a subtotal. Percentage discounts are capped by maxDiscount when set.
 */
export function calculateDiscountAmount(subtotal: number, discount: DiscountInput): number {
  if (discount.discountType === "FLAT") {
    return Math.min(discount.discountValue, subtotal);
  }
  const raw = Math.round((discount.discountValue / 100) * subtotal);
  const capped = discount.maxDiscount ? Math.min(raw, discount.maxDiscount) : raw;
  return Math.min(capped, subtotal);
}

/**
 * Tax base = subtotal - discount + deliveryFee (discount applied before PPN).
 * This ordering is documented in the README and kept consistent everywhere
 * (checkout preview, order creation, reports).
 */
export function calculateOrderTotals(params: {
  subtotal: number;
  discountAmount: number;
  deliveryMethod: DeliveryMethod;
}) {
  const deliveryFee = DELIVERY_FEES[params.deliveryMethod];
  const taxBase = Math.max(0, params.subtotal - params.discountAmount) + deliveryFee;
  const ppn = Math.round(taxBase * PPN_RATE);
  const total = taxBase + ppn;
  return { deliveryFee, ppn, total };
}

// Driver earning rule: 80% of the order's delivery fee. Documented in README.
export function calculateDriverEarning(deliveryFee: number) {
  return Math.round(deliveryFee * 0.8);
}
