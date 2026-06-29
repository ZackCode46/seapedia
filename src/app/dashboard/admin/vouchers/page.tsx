"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

type Voucher = {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  maxDiscount: number | null;
  expiresAt: string;
  usageLimit: number;
  usedCount: number;
};

const emptyForm = {
  code: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: "10",
  maxDiscount: "",
  expiresAt: "",
  usageLimit: "100",
};

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function load() {
    const res = await fetch("/api/admin/vouchers");
    if (res.status === 401 || res.status === 403) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    setVouchers(data.vouchers ?? []);
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.toUpperCase(),
          description: form.description,
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
          expiresAt: new Date(form.expiresAt).toISOString(),
          usageLimit: Number(form.usageLimit),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal membuat voucher");
        return;
      }
      setForm(emptyForm);
      load();
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="px-4 py-16 text-center text-slate-500">Memuat...</p>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Kelola Voucher</h1>

      <div className="mt-6 grid gap-6 md:grid-cols-[320px_1fr]">
        <Card>
          <h2 className="font-semibold text-slate-800">Buat Voucher Baru</h2>
          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            <Input label="Kode" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            <Input label="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Tipe Diskon</label>
              <select
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
              >
                <option value="PERCENTAGE">Persentase (%)</option>
                <option value="FLAT">Potongan Flat (Rp)</option>
              </select>
            </div>
            <Input label="Nilai Diskon" type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} required />
            {form.discountType === "PERCENTAGE" && (
              <Input label="Maks. Potongan (Rp, opsional)" type="number" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} />
            )}
            <Input label="Tanggal Kedaluwarsa" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} required />
            <Input label="Limit Pemakaian" type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} required />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" fullWidth disabled={saving}>
              {saving ? "Menyimpan..." : "Buat Voucher"}
            </Button>
          </form>
        </Card>

        <div className="space-y-3">
          {vouchers.length === 0 && <p className="text-sm text-slate-500">Belum ada voucher.</p>}
          {vouchers.map((v) => {
            const expired = new Date(v.expiresAt) < new Date();
            const exhausted = v.usedCount >= v.usageLimit;
            return (
              <Link key={v.id} href={`/dashboard/admin/vouchers/${v.id}`}>
                <Card className="flex items-center justify-between hover:border-emerald-400">
                  <div>
                    <p className="font-mono font-semibold text-slate-800">{v.code}</p>
                    <p className="text-sm text-slate-500">
                      {v.discountType === "PERCENTAGE" ? `${v.discountValue}%` : `Rp${v.discountValue.toLocaleString("id-ID")}`}
                      {v.maxDiscount ? ` (maks Rp${v.maxDiscount.toLocaleString("id-ID")})` : ""}
                    </p>
                    <p className="text-xs text-slate-400">
                      Pemakaian {v.usedCount}/{v.usageLimit} · Kedaluwarsa {new Date(v.expiresAt).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <span className={`rounded px-2 py-0.5 text-xs ${expired || exhausted ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {expired ? "Kedaluwarsa" : exhausted ? "Habis" : "Aktif"}
                  </span>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
