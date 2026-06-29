"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

type Promo = {
  id: string;
  name: string;
  discountType: string;
  discountValue: number;
  maxDiscount: number | null;
  expiresAt: string;
  isActive: boolean;
};

const emptyForm = {
  name: "",
  discountType: "PERCENTAGE",
  discountValue: "10",
  maxDiscount: "",
  expiresAt: "",
};

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function load() {
    const res = await fetch("/api/admin/promos");
    if (res.status === 401 || res.status === 403) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    setPromos(data.promos ?? []);
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
      const res = await fetch("/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
          expiresAt: new Date(form.expiresAt).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal membuat promo");
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
      <h1 className="text-2xl font-bold text-slate-900">Kelola Promo</h1>

      <div className="mt-6 grid gap-6 md:grid-cols-[320px_1fr]">
        <Card>
          <h2 className="font-semibold text-slate-800">Buat Promo Baru</h2>
          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            <Input label="Nama Promo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
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
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" fullWidth disabled={saving}>
              {saving ? "Menyimpan..." : "Buat Promo"}
            </Button>
          </form>
        </Card>

        <div className="space-y-3">
          {promos.length === 0 && <p className="text-sm text-slate-500">Belum ada promo.</p>}
          {promos.map((p) => {
            const expired = new Date(p.expiresAt) < new Date();
            return (
              <Link key={p.id} href={`/dashboard/admin/promos/${p.id}`}>
                <Card className="flex items-center justify-between hover:border-emerald-400">
                  <div>
                    <p className="font-semibold text-slate-800">{p.name}</p>
                    <p className="text-sm text-slate-500">
                      {p.discountType === "PERCENTAGE" ? `${p.discountValue}%` : `Rp${p.discountValue.toLocaleString("id-ID")}`}
                      {p.maxDiscount ? ` (maks Rp${p.maxDiscount.toLocaleString("id-ID")})` : ""}
                    </p>
                    <p className="text-xs text-slate-400">Kedaluwarsa {new Date(p.expiresAt).toLocaleDateString("id-ID")}</p>
                  </div>
                  <span className={`rounded px-2 py-0.5 text-xs ${expired || !p.isActive ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {expired ? "Kedaluwarsa" : p.isActive ? "Aktif" : "Nonaktif"}
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
