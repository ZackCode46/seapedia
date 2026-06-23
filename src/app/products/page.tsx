import Link from "next/link";
import Card from "@/components/ui/Card";
import { dummyProducts } from "@/lib/dummyData";

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Katalog Produk</h1>
      <p className="mt-1 text-sm text-slate-600">
        Semua orang, termasuk tamu tanpa akun, bisa melihat katalog dan detail produk ini.
        Data di bawah masih dummy — akan diganti data toko/produk asli pada Level 2.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {dummyProducts.map((p) => (
          <Link key={p.id} href={`/products/${p.id}`}>
            <Card className="h-full">
              <img src={p.imageUrl} alt={p.name} className="aspect-square w-full rounded-lg object-cover" />
              <h3 className="mt-2 line-clamp-2 text-sm font-medium text-slate-800">{p.name}</h3>
              <p className="text-xs text-slate-500">{p.storeName}</p>
              <p className="mt-1 font-semibold text-emerald-700">
                Rp{p.price.toLocaleString("id-ID")}
              </p>
              <p className="text-xs text-slate-400">Stok: {p.stock}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
