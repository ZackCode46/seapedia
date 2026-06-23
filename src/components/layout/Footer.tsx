import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-3">
        <div>
          <h3 className="text-lg font-bold text-emerald-700">SEAPEDIA</h3>
          <p className="mt-2 text-sm text-slate-600">
            Marketplace multi-seller yang menghubungkan Penjual, Pembeli, dan Driver
            dalam satu pengalaman belanja.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-800">Tautan</h4>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            <li><Link href="/products" className="hover:text-emerald-700">Produk</Link></li>
            <li><Link href="/login" className="hover:text-emerald-700">Masuk</Link></li>
            <li><Link href="/register" className="hover:text-emerald-700">Daftar</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-800">Catatan</h4>
          <p className="mt-2 text-sm text-slate-600">
            Setiap toko hanya bisa dibeli dalam satu keranjang per transaksi
            (single-store checkout).
          </p>
        </div>
      </div>
      <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} SEAPEDIA. Built for the SEAPEDIA Technical Challenge.
      </div>
    </footer>
  );
}
