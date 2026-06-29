"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

type PromoDetail = {
  name: string;
  discountType: string;
  discountValue: number;
  maxDiscount: number | null;
  expiresAt: string;
  isActive: boolean;
  orders: { id: string; total: number; createdAt: string; buyer: { name: string } }[];
};

export default function AdminPromoDetailPage() {
  const [promo, setPromo] = useState<PromoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams<{ id: string }>();

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/admin/promos/${params.id}`);
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setPromo(data.promo);
      setLoading(false);
    })();
  }, [params.id, router]);

  if (loading) return <p className="px-4 py-16 text-center text-slate-500">Memuat...</p>;
  if (!promo) return <p className="px-4 py-16 text-center text-red-600">Promo tidak ditemukan</p>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{promo.name}</h1>
        <Link href="/dashboard/admin/promos"><Button variant="outline">Kembali</Button></Link>
      </div>

      <Card className="mt-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-slate-500">Tipe Diskon</p><p className="font-medium">{promo.discountType}</p></div>
          <div><p className="text-slate-500">Nilai</p><p className="font-medium">{promo.discountValue}{promo.discountType === "PERCENTAGE" ? "%" : " (Rp)"}</p></div>
          <div><p className="text-slate-500">Maks. Potongan</p><p className="font-medium">{promo.maxDiscount ? `Rp${promo.maxDiscount.toLocaleString("id-ID")}` : "-"}</p></div>
          <div><p className="text-slate-500">Kedaluwarsa</p><p className="font-medium">{new Date(promo.expiresAt).toLocaleDateString("id-ID")}</p></div>
          <div><p className="text-slate-500">Status</p><p className="font-medium">{promo.isActive ? "Aktif" : "Nonaktif"}</p></div>
        </div>
      </Card>

      <h2 className="mt-6 font-semibold text-slate-800">Order yang Memakai Promo Ini</h2>
      <div className="mt-2 space-y-2">
        {promo.orders.length === 0 && <p className="text-sm text-slate-500">Belum pernah dipakai.</p>}
        {promo.orders.map((o) => (
          <Card key={o.id} className="flex justify-between text-sm">
            <span>{o.buyer.name} · {new Date(o.createdAt).toLocaleDateString("id-ID")}</span>
            <span className="font-medium text-emerald-700">Rp{o.total.toLocaleString("id-ID")}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
