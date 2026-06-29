"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import OrderDetailView, { OrderDetail } from "@/components/layout/OrderDetailView";

export default function BuyerOrderDetailPage() {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const params = useParams<{ id: string }>();

  useEffect(() => {
    (async () => {
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
    })();
  }, [params.id, router]);

  if (loading) return <p className="px-4 py-16 text-center text-slate-500">Memuat...</p>;
  if (error) return <p className="px-4 py-16 text-center text-red-600">{error}</p>;
  if (!order) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Detail Pesanan</h1>
      <div className="mt-4">
        <OrderDetailView order={order} />
      </div>
    </div>
  );
}
