"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";

const statusLabel: Record<string, string> = {
  SEDANG_DIKEMAS: "Sedang Dikemas",
  MENUNGGU_PENGIRIM: "Menunggu Pengirim",
  SEDANG_DIKIRIM: "Sedang Dikirim",
  PESANAN_SELESAI: "Pesanan Selesai",
  DIKEMBALIKAN: "Dikembalikan",
};

const statusColor: Record<string, string> = {
  SEDANG_DIKEMAS: "bg-amber-100 text-amber-700",
  MENUNGGU_PENGIRIM: "bg-blue-100 text-blue-700",
  SEDANG_DIKIRIM: "bg-indigo-100 text-indigo-700",
  PESANAN_SELESAI: "bg-emerald-100 text-emerald-700",
  DIKEMBALIKAN: "bg-red-100 text-red-700",
};

type Order = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  store: { name: string };
  items: { id: string; quantity: number; product: { name: string } }[];
};

export default function BuyerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/orders");
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setOrders(data.orders ?? []);
      setLoading(false);
    })();
  }, [router]);

  if (loading) return <p className="px-4 py-16 text-center text-slate-500">Memuat...</p>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Riwayat Pesanan</h1>

      <div className="mt-4 space-y-3">
        {orders.length === 0 && <p className="text-sm text-slate-500">Belum ada pesanan.</p>}
        {orders.map((o) => (
          <Link key={o.id} href={`/dashboard/buyer/orders/${o.id}`}>
            <Card className="hover:border-emerald-400">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-800">{o.store.name}</p>
                <span className={`rounded px-2 py-0.5 text-xs ${statusColor[o.status]}`}>
                  {statusLabel[o.status]}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {o.items.map((it) => `${it.product.name} x${it.quantity}`).join(", ")}
              </p>
              <div className="mt-1 flex justify-between text-sm">
                <span className="text-slate-400">{new Date(o.createdAt).toLocaleString("id-ID")}</span>
                <span className="font-semibold text-emerald-700">Rp{o.total.toLocaleString("id-ID")}</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
