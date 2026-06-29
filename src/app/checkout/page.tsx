"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { DELIVERY_FEES, PPN_RATE } from "@/lib/orderPricing";

type Address = { id: string; label: string; recipient: string; fullAddress: string; city: string; isDefault: boolean };
type Promo = { id: string; name: string; discountType: "PERCENTAGE" | "FLAT"; discountValue: number; maxDiscount: number | null };

const methodLabel: Record<string, string> = {
  INSTANT: "Instant",
  NEXT_DAY: "Next Day",
  REGULAR: "Regular",
};

function computeDiscount(subtotal: number, d: { discountType: string; discountValue: number; maxDiscount: number | null } | null) {
  if (!d) return 0;
  if (d.discountType === "FLAT") return Math.min(d.discountValue, subtotal);
  const raw = Math.round((d.discountValue / 100) * subtotal);
  const capped = d.maxDiscount ? Math.min(raw, d.maxDiscount) : raw;
  return Math.min(capped, subtotal);
}

export default function CheckoutPage() {
  const [subtotal, setSubtotal] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState("");
  const [method, setMethod] = useState<keyof typeof DELIVERY_FEES>("REGULAR");
  const [promos, setPromos] = useState<Promo[]>([]);
  const [selectedPromoId, setSelectedPromoId] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherResult, setVoucherResult] = useState<{ discountAmount: number; code: string } | null>(null);
  const [voucherError, setVoucherError] = useState("");
  const [checkingVoucher, setCheckingVoucher] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const [cartRes, addrRes, promoRes] = await Promise.all([
        fetch("/api/cart"),
        fetch("/api/addresses"),
        fetch("/api/discounts/promos"),
      ]);
      if (cartRes.status === 401 || addrRes.status === 401) {
        router.push("/login");
        return;
      }
      const cartData = await cartRes.json();
      const addrData = await addrRes.json();
      const promoData = await promoRes.json();
      setSubtotal(cartData.subtotal ?? 0);
      setItemCount((cartData.items ?? []).length);
      setAddresses(addrData.addresses ?? []);
      setPromos(promoData.promos ?? []);
      const def = (addrData.addresses ?? []).find((a: Address) => a.isDefault);
      setAddressId(def?.id ?? addrData.addresses?.[0]?.id ?? "");
      setLoading(false);
    })();
  }, [router]);

  async function handleCheckVoucher() {
    if (!voucherCode.trim()) return;
    setCheckingVoucher(true);
    setVoucherError("");
    setVoucherResult(null);
    try {
      const res = await fetch("/api/discounts/validate-voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: voucherCode, subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVoucherError(data.error || "Voucher tidak valid");
        return;
      }
      setVoucherResult({ discountAmount: data.discountAmount, code: data.voucher.code });
    } catch {
      setVoucherError("Terjadi kesalahan jaringan");
    } finally {
      setCheckingVoucher(false);
    }
  }

  const selectedPromo = promos.find((p) => p.id === selectedPromoId) ?? null;
  const promoDiscount = computeDiscount(subtotal, selectedPromo);
  const voucherDiscount = voucherResult?.discountAmount ?? 0;
  const totalDiscount = Math.min(promoDiscount + voucherDiscount, subtotal);

  const deliveryFee = DELIVERY_FEES[method];
  const taxBase = Math.max(0, subtotal - totalDiscount) + deliveryFee;
  const ppn = Math.round(taxBase * PPN_RATE);
  const total = taxBase + ppn;

  async function handleConfirm() {
    if (!addressId) {
      setError("Pilih alamat pengiriman terlebih dahulu");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId,
          deliveryMethod: method,
          voucherCode: voucherResult ? voucherResult.code : undefined,
          promoId: selectedPromoId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Checkout gagal");
        return;
      }
      router.push(`/dashboard/buyer/orders/${data.order.id}`);
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="px-4 py-16 text-center text-slate-500">Memuat...</p>;

  if (itemCount === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-slate-600">Keranjang kamu kosong, tidak ada yang bisa di-checkout.</p>
        <Link href="/products"><Button className="mt-3">Belanja Sekarang</Button></Link>
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-slate-600">Kamu belum punya alamat pengiriman.</p>
        <Link href="/dashboard/buyer/addresses"><Button className="mt-3">Tambah Alamat</Button></Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>

      <Card className="mt-4">
        <h2 className="font-semibold text-slate-800">Alamat Pengiriman</h2>
        <div className="mt-2 space-y-2">
          {addresses.map((a) => (
            <label key={a.id} className="flex items-start gap-2 rounded-lg border p-3 text-sm">
              <input
                type="radio"
                name="address"
                checked={addressId === a.id}
                onChange={() => setAddressId(a.id)}
                className="mt-1"
              />
              <span>
                <span className="font-medium">{a.label}</span> · {a.recipient}
                <br />
                <span className="text-slate-500">{a.fullAddress}, {a.city}</span>
              </span>
            </label>
          ))}
        </div>
      </Card>

      <Card className="mt-4">
        <h2 className="font-semibold text-slate-800">Metode Pengiriman</h2>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(Object.keys(DELIVERY_FEES) as Array<keyof typeof DELIVERY_FEES>).map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`rounded-lg border p-3 text-sm ${method === m ? "border-emerald-600 bg-emerald-50" : "border-slate-200"}`}
            >
              <p className="font-medium">{methodLabel[m]}</p>
              <p className="text-xs text-slate-500">Rp{DELIVERY_FEES[m].toLocaleString("id-ID")}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card className="mt-4">
        <h2 className="font-semibold text-slate-800">Promo</h2>
        <p className="mt-1 text-xs text-slate-400">Voucher dan Promo bisa digabung dalam satu transaksi.</p>
        <div className="mt-2 space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="promo"
              checked={selectedPromoId === ""}
              onChange={() => setSelectedPromoId("")}
            />
            Tidak pakai promo
          </label>
          {promos.map((p) => (
            <label key={p.id} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="promo"
                checked={selectedPromoId === p.id}
                onChange={() => setSelectedPromoId(p.id)}
              />
              {p.name} ({p.discountType === "PERCENTAGE" ? `${p.discountValue}%` : `Rp${p.discountValue.toLocaleString("id-ID")}`})
            </label>
          ))}
        </div>

        <h2 className="mt-4 font-semibold text-slate-800">Kode Voucher</h2>
        <div className="mt-2 flex gap-2">
          <input
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase outline-none focus:ring-2 focus:ring-emerald-500"
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value)}
            placeholder="Masukkan kode voucher"
          />
          <Button type="button" variant="outline" onClick={handleCheckVoucher} disabled={checkingVoucher}>
            {checkingVoucher ? "Mengecek..." : "Pakai"}
          </Button>
        </div>
        {voucherError && <p className="mt-1 text-sm text-red-600">{voucherError}</p>}
        {voucherResult && (
          <p className="mt-1 text-sm text-emerald-600">
            Voucher {voucherResult.code} diterapkan: -Rp{voucherResult.discountAmount.toLocaleString("id-ID")}
          </p>
        )}
      </Card>

      <Card className="mt-4">
        <h2 className="font-semibold text-slate-800">Ringkasan Pembayaran</h2>
        <div className="mt-2 space-y-1 text-sm text-slate-600">
          <div className="flex justify-between"><span>Subtotal</span><span>Rp{subtotal.toLocaleString("id-ID")}</span></div>
          <div className="flex justify-between"><span>Diskon</span><span>-Rp{totalDiscount.toLocaleString("id-ID")}</span></div>
          <div className="flex justify-between"><span>Biaya Pengiriman ({methodLabel[method]})</span><span>Rp{deliveryFee.toLocaleString("id-ID")}</span></div>
          <div className="flex justify-between"><span>PPN 12%</span><span>Rp{ppn.toLocaleString("id-ID")}</span></div>
          <div className="mt-2 flex justify-between border-t pt-2 font-bold text-slate-900">
            <span>Total</span><span>Rp{total.toLocaleString("id-ID")}</span>
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <Button fullWidth className="mt-4" onClick={handleConfirm} disabled={submitting}>
          {submitting ? "Memproses..." : "Bayar dengan Wallet"}
        </Button>
      </Card>
    </div>
  );
}
