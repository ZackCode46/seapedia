"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

type GroupCount = { role?: string; status?: string; _count: number };
type Monitoring = {
  simulatedNow: string;
  users: { total: number; byRole: GroupCount[] };
  stores: { total: number };
  products: { total: number };
  orders: { total: number; byStatus: GroupCount[] };
  vouchers: { total: number; active: number };
  promos: { total: number; active: number };
  deliveries: { waiting: number; onDelivery: number; completed: number };
  overdue: { pendingCount: number; returnedCount: number };
};

const statusLabel: Record<string, string> = {
  SEDANG_DIKEMAS: "Sedang Dikemas",
  MENUNGGU_PENGIRIM: "Menunggu Pengirim",
  SEDANG_DIKIRIM: "Sedang Dikirim",
  PESANAN_SELESAI: "Pesanan Selesai",
  DIKEMBALIKAN: "Dikembalikan",
};

export default function AdminMonitoringPage() {
  const [data, setData] = useState<Monitoring | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/monitoring");
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      const json = await res.json();
      setData(json);
      setLoading(false);
    })();
  }, [router]);

  if (loading) return <p className="px-4 py-16 text-center text-slate-500">Memuat...</p>;
  if (!data) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Monitoring Marketplace</h1>
          <p className="text-sm text-slate-500">
            Waktu sistem (simulasi): {new Date(data.simulatedNow).toLocaleString("id-ID")}
          </p>
        </div>
        <Link href="/dashboard/admin/overdue"><Button>Kelola Overdue</Button></Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <p className="text-sm text-slate-500">Total Users</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{data.users.total}</p>
          <p className="mt-1 text-xs text-slate-400">
            {data.users.byRole.map((r) => `${r.role}: ${r._count}`).join(" · ")}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Total Toko</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{data.stores.total}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Total Produk</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{data.products.total}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Total Order</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{data.orders.total}</p>
        </Card>
      </div>

      <h2 className="mt-6 font-semibold text-slate-800">Order per Status</h2>
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {data.orders.byStatus.map((s) => (
          <Card key={s.status}>
            <p className="text-xs text-slate-500">{statusLabel[s.status ?? ""] ?? s.status}</p>
            <p className="mt-1 text-xl font-bold text-slate-800">{s._count}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Voucher</p>
          <p className="mt-1 text-xl font-bold text-slate-800">{data.vouchers.active} aktif</p>
          <p className="text-xs text-slate-400">dari {data.vouchers.total} total</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Promo</p>
          <p className="mt-1 text-xl font-bold text-slate-800">{data.promos.active} aktif</p>
          <p className="text-xs text-slate-400">dari {data.promos.total} total</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Delivery Jobs</p>
          <p className="mt-1 text-sm text-slate-700">
            {data.deliveries.waiting} menunggu · {data.deliveries.onDelivery} dikirim · {data.deliveries.completed} selesai
          </p>
        </Card>
        <Card className={data.overdue.pendingCount > 0 ? "border-red-300 bg-red-50" : ""}>
          <p className="text-sm text-slate-500">Order Overdue (belum diproses)</p>
          <p className="mt-1 text-xl font-bold text-red-600">{data.overdue.pendingCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Sudah Dikembalikan/Refund</p>
          <p className="mt-1 text-xl font-bold text-slate-800">{data.overdue.returnedCount}</p>
        </Card>
      </div>
    </div>
  );
}
