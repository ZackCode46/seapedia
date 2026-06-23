import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import AppReviewSection from "@/components/layout/AppReviewSection";
import { dummyProducts } from "@/lib/dummyData";

export default function HomePage() {
  return (
    <div>
      <section className="bg-gradient-to-b from-emerald-50 to-slate-50 px-4 py-16">
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="text-3xl font-extrabold text-slate-900 md:text-5xl">
            Belanja, Jualan, dan Antar Barang
            <span className="text-emerald-700"> dalam Satu Marketplace</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            SEAPEDIA menghubungkan Penjual, Pembeli, dan Driver dari berbagai toko
            dalam satu ekosistem marketplace — bukan hanya katalog satu toko.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/products">
              <Button>Jelajahi Produk</Button>
            </Link>
            <Link href="/register">
              <Button variant="outline">Daftar Sekarang</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Produk Pilihan</h2>
          <Link href="/products" className="text-sm text-emerald-700 hover:underline">
            Lihat semua &rarr;
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {dummyProducts.map((p) => (
            <Link key={p.id} href={`/products/${p.id}`}>
              <Card className="h-full">
                <img src={p.imageUrl} alt={p.name} className="aspect-square w-full rounded-lg object-cover" />
                <h3 className="mt-2 line-clamp-2 text-sm font-medium text-slate-800">{p.name}</h3>
                <p className="text-xs text-slate-500">{p.storeName}</p>
                <p className="mt-1 font-semibold text-emerald-700">
                  Rp{p.price.toLocaleString("id-ID")}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { title: "Multi Penjual", desc: "Banyak toko independen dalam satu marketplace." },
            { title: "Multi Role", desc: "Satu akun bisa jadi Pembeli, Penjual, dan Driver." },
            { title: "Pengiriman Fleksibel", desc: "Instant, Next Day, atau Regular." },
            { title: "Aman & Transparan", desc: "Riwayat status pesanan tercatat lengkap." },
          ].map((f) => (
            <Card key={f.title}>
              <h4 className="font-semibold text-slate-800">{f.title}</h4>
              <p className="mt-1 text-sm text-slate-600">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <AppReviewSection />
    </div>
  );
}
