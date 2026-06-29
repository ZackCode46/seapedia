"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

type VoucherDetail = {
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  maxDiscount: number | null;
  expiresAt: string;
  usageLimit: number;
  usedCount: number;
  orders: { id: string; total: number; createdAt: string; buyer: { name: string } }[];
};

export default function AdminVoucherDetailPage() {
  const [voucher, setVoucher] = useState<VoucherDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams<{ id: string }>();

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/admin/vouchers/${params.id}`);
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setVoucher(data.voucher);
      setLoading(false);
    })();
  }, [params.id, router]);

  if (loading) return <p className="px-4 py-16 text-center text-slate-500">Memuat...</p>;
  if (!voucher) return <p className="px-4 py-16 text-center text-red-600">Voucher tidak ditemukan</p>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-mono text-2xl font-bold text-slate-900">{voucher.code}</h1>
        <Link href="/dashboard/admin/vouchers"><Button variant="outline">Kembali</Button></Link>
      </div>
      <p className="mt-1 text-sm text-slate-600">{voucher.description || "Tidak ada deskripsi"}</p>

      <Card className="mt-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-slate-500">Tipe Diskon</p><p className="font-medium">{voucher.discountType}</p></div>
          <div><p className="text-slate-500">Nilai</p><p className="font-medium">{voucher.discountValue}{voucher.discountType === "PERCENTAGE" ? "%" : " (Rp)"}</p></div>
          <div><p className="text-slate-500">Maks. Potongan</p><p className="font-medium">{voucher.maxDiscount ? `Rp${voucher.maxDiscount.toLocaleString("id-ID")}` : "-"}</p></div>
          <div><p className="text-slate-500">Kedaluwarsa</p><p className="font-medium">{new Date(voucher.expiresAt).toLocaleDateString("id-ID")}</p></div>
          <div><p className="text-slate-500">Pemakaian</p><p className="font-medium">{voucher.usedCount} / {voucher.usageLimit}</p></div>
        </div>
      </Card>

      <h2 className="mt-6 font-semibold text-slate-800">Order yang Memakai Voucher Ini</h2>
      <div className="mt-2 space-y-2">
        {voucher.orders.length === 0 && <p className="text-sm text-slate-500">Belum pernah dipakai.</p>}
        {voucher.orders.map((o) => (
          <Card key={o.id} className="flex justify-between text-sm">
            <span>{o.buyer.name} · {new Date(o.createdAt).toLocaleDateString("id-ID")}</span>
            <span className="font-medium text-emerald-700">Rp{o.total.toLocaleString("id-ID")}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
