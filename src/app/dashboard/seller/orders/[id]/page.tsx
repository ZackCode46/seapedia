"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import OrderDetailView, { OrderDetail } from "@/components/layout/OrderDetailView";
import Button from "@/components/ui/Button";

export default function SellerOrderDetailPage() {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const params = useParams<{ id: string }>();

  async function load() {
    const res = await fetch(`/api/orders/${params.id}`);
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Gagal memuat order");
      setLoading(false);
      return;
    }
    setOrder(data.order);
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleProcess() {
    setProcessing(true);
    setError("");
    try {
      const res = await fetch(`/api/seller/orders/${params.id}/process`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal memproses order");
        return;
      }
      await load();
    } finally {
      setProcessing(false);
    }
  }

  if (loading) return <p className="px-4 py-16 text-center text-slate-500">Memuat...</p>;
  if (error && !order) return <p className="px-4 py-16 text-center text-red-600">{error}</p>;
  if (!order) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Detail Pesanan Masuk</h1>
        {order.status === "SEDANG_DIKEMAS" && (
          <Button onClick={handleProcess} disabled={processing}>
            {processing ? "Memproses..." : "Proses Pesanan"}
          </Button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-4">
        <OrderDetailView order={order} />
      </div>
    </div>
  );
}
