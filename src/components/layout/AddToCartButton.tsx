"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

type Me = { activeRole: string | null } | null;

export default function AddToCartButton({ productId, isDummy }: { productId: string; isDummy: boolean }) {
  const [me, setMe] = useState<Me>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d.user))
      .finally(() => setLoading(false));
  }, []);

  if (isDummy) {
    return (
      <>
        <Button disabled fullWidth className="mt-4">
          Produk Contoh (belum tersedia untuk dibeli)
        </Button>
        <p className="mt-2 text-xs text-slate-400">
          Ini data contoh. Produk asli dari Seller bisa langsung dibeli.
        </p>
      </>
    );
  }

  if (loading) {
    return <Button disabled fullWidth className="mt-4">Memuat...</Button>;
  }

  if (!me) {
    return (
      <>
        <Button fullWidth className="mt-4" onClick={() => router.push("/login")}>
          Masuk untuk Membeli
        </Button>
        <p className="mt-2 text-xs text-slate-400">
          Tamu hanya dapat melihat katalog. Login sebagai Buyer untuk berbelanja.
        </p>
      </>
    );
  }

  if (me.activeRole !== "BUYER") {
    return (
      <Button disabled fullWidth className="mt-4">
        Hanya Buyer yang Bisa Berbelanja
      </Button>
    );
  }

  async function handleAdd() {
    setAdding(true);
    setMessage("");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "SINGLE_STORE_CONFLICT") {
          setMessage(data.error);
        } else {
          setMessage(data.error || "Gagal menambah ke keranjang");
        }
        return;
      }
      router.push("/cart");
    } catch {
      setMessage("Terjadi kesalahan jaringan");
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      <Button fullWidth className="mt-4" onClick={handleAdd} disabled={adding}>
        {adding ? "Menambahkan..." : "Tambah ke Keranjang"}
      </Button>
      {message && <p className="mt-2 text-sm text-red-600">{message}</p>}
    </>
  );
}
