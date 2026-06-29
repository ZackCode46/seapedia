"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";

type Summary = { totalSpent: number; totalDiscount: number; totalOrders: number; totalCompleted: number; totalReturned: number };

export default function BuyerReportsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/reports/buyer");
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setSummary(data.summary);
      setLoading(false);
    })();
  }, [router]);

  if (loading) return <p className="px-4 py-16 text-center text-slate-500">Memuat...</p>;
  if (!summary) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Laporan Pengeluaran</h1>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Total Belanja</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">Rp{summary.totalSpent.toLocaleString("id-ID")}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Total Hemat (Diskon)</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">Rp{summary.totalDiscount.toLocaleString("id-ID")}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Total Pesanan</p>
          <p className="mt-1 text-xl font-bold text-slate-800">{summary.totalOrders}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Pesanan Selesai</p>
          <p className="mt-1 text-xl font-bold text-slate-800">{summary.totalCompleted}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Pesanan Dikembalikan</p>
          <p className="mt-1 text-xl font-bold text-red-600">{summary.totalReturned}</p>
        </Card>
      </div>
    </div>
  );
}
