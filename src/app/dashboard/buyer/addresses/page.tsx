"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

type Address = {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  fullAddress: string;
  city: string;
  isDefault: boolean;
};

const emptyForm = { label: "", recipient: "", phone: "", fullAddress: "", city: "", isDefault: false };

export default function BuyerAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function load() {
    const res = await fetch("/api/addresses");
    if (res.status === 401 || res.status === 403) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    setAddresses(data.addresses ?? []);
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
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal menambah alamat");
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

  async function handleDelete(id: string) {
    if (!confirm("Hapus alamat ini?")) return;
    await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    load();
  }

  async function handleSetDefault(id: string) {
    await fetch(`/api/addresses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    load();
  }

  if (loading) return <p className="px-4 py-16 text-center text-slate-500">Memuat...</p>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Alamat Pengiriman</h1>

      <div className="mt-4 grid gap-6 md:grid-cols-[300px_1fr]">
        <Card>
          <h2 className="font-semibold text-slate-800">Tambah Alamat</h2>
          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            <Input label="Label (Rumah/Kantor)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
            <Input label="Nama Penerima" value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} required />
            <Input label="No. HP" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            <Input label="Kota" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Alamat Lengkap</label>
              <textarea
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                rows={3}
                value={form.fullAddress}
                onChange={(e) => setForm({ ...form, fullAddress: e.target.value })}
                required
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              />
              Jadikan alamat utama
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" fullWidth disabled={saving}>
              {saving ? "Menyimpan..." : "Tambah Alamat"}
            </Button>
          </form>
        </Card>

        <div className="space-y-3">
          {addresses.length === 0 && <p className="text-sm text-slate-500">Belum ada alamat tersimpan.</p>}
          {addresses.map((a) => (
            <Card key={a.id}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-slate-800">
                    {a.label} {a.isDefault && <span className="ml-1 rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Utama</span>}
                  </p>
                  <p className="text-sm text-slate-600">{a.recipient} · {a.phone}</p>
                  <p className="text-sm text-slate-500">{a.fullAddress}, {a.city}</p>
                </div>
                <div className="flex flex-col gap-1">
                  {!a.isDefault && (
                    <Button variant="outline" onClick={() => handleSetDefault(a.id)}>
                      Jadikan Utama
                    </Button>
                  )}
                  <Button variant="danger" onClick={() => handleDelete(a.id)}>
                    Hapus
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
