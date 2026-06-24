"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
};

const emptyForm = { name: "", description: "", price: "", stock: "", imageUrl: "" };

export default function SellerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function loadProducts() {
    const res = await fetch("/api/seller/products");
    if (res.status === 401 || res.status === 403) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    setProducts(data.products ?? []);
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      await loadProducts();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description ?? "",
      price: String(p.price),
      stock: String(p.stock),
      imageUrl: p.imageUrl ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      stock: Number(form.stock),
      imageUrl: form.imageUrl,
    };
    try {
      const res = await fetch(
        editingId ? `/api/seller/products/${editingId}` : "/api/seller/products",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal menyimpan produk");
        return;
      }
      cancelEdit();
      loadProducts();
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus produk ini?")) return;
    await fetch(`/api/seller/products/${id}`, { method: "DELETE" });
    loadProducts();
  }

  if (loading) return <p className="px-4 py-16 text-center text-slate-500">Memuat...</p>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Kelola Produk</h1>
      <p className="mt-1 text-sm text-slate-600">
        Produk yang kamu buat di sini akan otomatis tampil di katalog publik SEAPEDIA.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-[320px_1fr]">
        <Card>
          <h2 className="font-semibold text-slate-800">
            {editingId ? "Edit Produk" : "Tambah Produk Baru"}
          </h2>
          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            <Input
              label="Nama Produk"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Deskripsi</label>
              <textarea
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <Input
              label="Harga (Rp)"
              type="number"
              min={1}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
            <Input
              label="Stok"
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              required
            />
            <Input
              label="URL Gambar (opsional)"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://..."
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" fullWidth disabled={saving}>
                {saving ? "Menyimpan..." : editingId ? "Update Produk" : "Tambah Produk"}
              </Button>
              {editingId && (
                <Button type="button" variant="ghost" onClick={cancelEdit}>
                  Batal
                </Button>
              )}
            </div>
          </form>
        </Card>

        <div className="space-y-3">
          {products.length === 0 && (
            <p className="text-sm text-slate-500">Belum ada produk. Tambahkan produk pertamamu.</p>
          )}
          {products.map((p) => (
            <Card key={p.id} className="flex items-center gap-4">
              <img
                src={p.imageUrl || "https://placehold.co/80x80?text=No+Image"}
                alt={p.name}
                className="h-16 w-16 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="font-medium text-slate-800">{p.name}</h3>
                <p className="text-sm text-emerald-700">Rp{p.price.toLocaleString("id-ID")}</p>
                <p className="text-xs text-slate-400">
                  Stok: {p.stock} · {p.isActive ? "Aktif" : "Nonaktif"}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <Button variant="outline" onClick={() => startEdit(p)}>
                  Edit
                </Button>
                <Button variant="danger" onClick={() => handleDelete(p.id)}>
                  Hapus
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
