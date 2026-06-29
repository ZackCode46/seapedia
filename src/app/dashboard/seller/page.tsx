import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getActiveRole } from "@/lib/auth";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default async function SellerDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const activeRole = await getActiveRole();
  if (activeRole !== "SELLER") redirect("/select-role");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Seller</h1>
          <p className="text-sm text-slate-500">
            Role aktif: <span className="font-medium text-emerald-700">{activeRole}</span> ·
            Semua role yang kamu miliki: {user.roles.map((r) => r.role).join(", ")}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/seller/store"><Button variant="outline">Kelola Toko</Button></Link>
          <Link href="/dashboard/seller/products"><Button variant="outline">Kelola Produk</Button></Link>
          <Link href="/dashboard/seller/orders"><Button variant="outline">Pesanan Masuk</Button></Link>
          <Link href="/dashboard/seller/reports"><Button>Laporan</Button></Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <h3 className="text-sm text-slate-500">Toko</h3>
          <p className="mt-1 text-lg font-semibold text-slate-800">
            {user.store ? user.store.name : "Belum membuat toko"}
          </p>
          {!user.store && (
            <Link href="/dashboard/seller/store" className="mt-2 inline-block text-sm text-emerald-700 hover:underline">
              Buat toko sekarang &rarr;
            </Link>
          )}
        </Card>
        <Link href="/dashboard/seller/orders">
          <Card>
            <h3 className="text-sm text-slate-500">Pesanan Masuk</h3>
            <p className="mt-1 text-sm text-slate-600">Lihat pesanan dari Buyer &rarr;</p>
          </Card>
        </Link>
        <Link href="/dashboard/seller/reports">
          <Card>
            <h3 className="text-sm text-slate-500">Pendapatan</h3>
            <p className="mt-1 text-sm text-emerald-700">Lihat laporan &rarr;</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
