"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

type CartItem = {
  id: string;
  quantity: number;
  product: { id: string; name: string; price: number; imageUrl: string | null; stock: number; store: { id: string; name: string } };
};

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();

  async function load() {
    const res = await fetch("/api/cart");
    if (res.status === 401 || res.status === 403) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    setItems(data.items ?? []);
    setSubtotal(data.subtotal ?? 0);
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateQty(itemId: string, qty: number) {
    if (qty < 1) return;
    setBusyId(itemId);
    await fetch(`/api/cart/items/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: qty }),
    });
    await load();
    setBusyId(null);
  }

  async function removeItem(itemId: string) {
    setBusyId(itemId);
    await fetch(`/api/cart/items/${itemId}`, { method: "DELETE" });
    await load();
    setBusyId(null);
  }

  async function clearCart() {
    if (!confirm("Kosongkan seluruh keranjang?")) return;
    await fetch("/api/cart", { method: "DELETE" });
    await load();
  }

  if (loading) return <p className="px-4 py-16 text-center text-slate-500">Memuat...</p>;

  const storeName = items[0]?.product.store.name;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Keranjang Belanja</h1>

      {storeName && (
        <p className="mt-1 text-sm text-slate-600">
          Belanja dari toko <span className="font-medium text-emerald-700">{storeName}</span> ·
          Ingat, satu keranjang hanya untuk satu toko (single-store checkout).
        </p>
      )}

      {items.length === 0 ? (
        <Card className="mt-4 text-center">
          <p className="text-sm text-slate-500">Keranjang kamu masih kosong.</p>
          <Link href="/products">
            <Button className="mt-3">Mulai Belanja</Button>
          </Link>
        </Card>
      ) : (
        <>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <Card key={item.id} className="flex items-center gap-4">
                <img
                  src={item.product.imageUrl || "https://placehold.co/80x80?text=No+Image"}
                  alt={item.product.name}
                  className="h-16 w-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{item.product.name}</p>
                  <p className="text-sm text-emerald-700">Rp{item.product.price.toLocaleString("id-ID")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded border px-2 py-1 text-sm disabled:opacity-50"
                    disabled={busyId === item.id}
                    onClick={() => updateQty(item.id, item.quantity - 1)}
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <button
                    className="rounded border px-2 py-1 text-sm disabled:opacity-50"
                    disabled={busyId === item.id || item.quantity >= item.product.stock}
                    onClick={() => updateQty(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <Button variant="danger" disabled={busyId === item.id} onClick={() => removeItem(item.id)}>
                  Hapus
                </Button>
              </Card>
            ))}
          </div>

          <Card className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Subtotal</p>
              <p className="text-xl font-bold text-emerald-700">Rp{subtotal.toLocaleString("id-ID")}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={clearCart}>Kosongkan</Button>
              <Link href="/checkout"><Button>Lanjut ke Checkout</Button></Link>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
