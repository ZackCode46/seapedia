"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function SellerStorePage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch("/api/store");
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (active && data.store) {
        setName(data.store.name);
        setDescription(data.store.description ?? "");
        setLogoUrl(data.store.logoUrl ?? "");
      }
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, logoUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal menyimpan toko");
        return;
      }
      setSuccess("Toko berhasil disimpan!");
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="px-4 py-16 text-center text-slate-500">Memuat...</p>;

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Profil Toko</h1>
      <p className="mt-1 text-sm text-slate-600">
        Nama toko harus unik di seluruh SEAPEDIA. Buyer akan melihat toko ini saat
        membeli produk kamu.
      </p>

      <Card className="mt-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="Nama Toko"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={3}
            maxLength={50}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Deskripsi</label>
            <textarea
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
            />
          </div>
          <Input
            label="URL Logo (opsional)"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://..."
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-emerald-600">{success}</p>}
          <Button type="submit" fullWidth disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan Toko"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
