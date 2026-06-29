import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getActiveRole } from "@/lib/auth";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default async function BuyerDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const activeRole = await getActiveRole();
  if (activeRole !== "BUYER") redirect("/select-role");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Buyer</h1>
          <p className="text-sm text-slate-500">
            Role aktif: <span className="font-medium text-emerald-700">{activeRole}</span> ·
            Semua role yang kamu miliki: {user.roles.map((r) => r.role).join(", ")}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/buyer/addresses"><Button variant="outline">Alamat</Button></Link>
          <Link href="/cart"><Button variant="outline">Keranjang</Button></Link>
          <Link href="/dashboard/buyer/orders"><Button variant="outline">Riwayat Pesanan</Button></Link>
          <Link href="/dashboard/buyer/reports"><Button>Laporan</Button></Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/buyer/wallet">
          <Card>
            <h3 className="text-sm text-slate-500">Saldo Wallet</h3>
            <p className="mt-1 text-xl font-bold text-emerald-700">
              {user.wallet ? `Rp${user.wallet.balance.toLocaleString("id-ID")}` : "Rp0"}
            </p>
            <p className="mt-1 text-xs text-emerald-600">Kelola wallet &amp; top-up &rarr;</p>
          </Card>
        </Link>
        <Link href="/cart">
          <Card>
            <h3 className="text-sm text-slate-500">Keranjang</h3>
            <p className="mt-1 text-sm text-slate-600">Lihat & kelola keranjang belanja</p>
          </Card>
        </Link>
        <Link href="/dashboard/buyer/orders">
          <Card>
            <h3 className="text-sm text-slate-500">Riwayat Pesanan</h3>
            <p className="mt-1 text-sm text-slate-600">Lacak status pesananmu</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
