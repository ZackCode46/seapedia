import { notFound } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { dummyProducts } from "@/lib/dummyData";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = dummyProducts.find((p) => p.id === id);
  if (!product) return notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="grid gap-8 md:grid-cols-2">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full rounded-xl object-cover"
        />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Dijual oleh <span className="font-medium text-emerald-700">{product.storeName}</span>
          </p>
          <p className="mt-4 text-2xl font-bold text-emerald-700">
            Rp{product.price.toLocaleString("id-ID")}
          </p>
          <p className="mt-1 text-sm text-slate-500">Stok tersedia: {product.stock}</p>

          <Card className="mt-4">
            <h3 className="font-medium text-slate-800">Deskripsi</h3>
            <p className="mt-1 text-sm text-slate-600">{product.description}</p>
          </Card>

          {/* Checkout intentionally disabled at this level — Buyer flow lands in Level 3. */}
          <Button disabled fullWidth className="mt-4">
            Tambah ke Keranjang (tersedia setelah login sebagai Buyer)
          </Button>
          <p className="mt-2 text-xs text-slate-400">
            Tamu hanya dapat melihat katalog dan detail produk. Login sebagai Buyer untuk
            berbelanja.
          </p>
        </div>
      </div>
    </div>
  );
}
