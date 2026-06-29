"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";

type Summary = { totalIncome: number; totalOrders: number; totalProcessed: number; totalReturned: number };

export default function SellerReportsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/reports/seller");
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Laporan Pendapatan</h1>
      <p className="mt-1 text-xs text-slate-400">
        Pendapatan = subtotal - diskon (tidak termasuk ongkir & PPN, dan tidak termasuk pesanan yang dikembalikan).
      </p>
      {!summary ? (
        <p className="mt-4 text-sm text-slate-500">Buat toko terlebih dahulu untuk melihat laporan.</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Card>
            <p className="text-sm text-slate-500">Total Pendapatan</p>
            <p className="mt-1 text-xl font-bold text-emerald-700">Rp{summary.totalIncome.toLocaleString("id-ID")}</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Total Pesanan</p>
            <p className="mt-1 text-xl font-bold text-slate-800">{summary.totalOrders}</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Sudah Diproses</p>
            <p className="mt-1 text-xl font-bold text-slate-800">{summary.totalProcessed}</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Dikembalikan</p>
            <p className="mt-1 text-xl font-bold text-red-600">{summary.totalReturned}</p>
          </Card>
        </div>
      )}
    </div>
  );
}
