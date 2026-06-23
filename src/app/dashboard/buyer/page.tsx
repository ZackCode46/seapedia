import { redirect } from "next/navigation";
import { getCurrentUser, getActiveRole } from "@/lib/auth";
import Card from "@/components/ui/Card";

export default async function BuyerDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const activeRole = await getActiveRole();
  if (activeRole !== "BUYER") redirect("/select-role");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard Buyer</h1>
      <p className="text-sm text-slate-500">
        Role aktif: <span className="font-medium text-emerald-700">{activeRole}</span> ·
        Semua role yang kamu miliki: {user.roles.map((r) => r.role).join(", ")}
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <h3 className="text-sm text-slate-500">Saldo Wallet</h3>
          <p className="mt-1 text-xl font-bold text-emerald-700">
            {user.wallet ? `Rp${user.wallet.balance.toLocaleString("id-ID")}` : "—"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Top-up &amp; riwayat transaksi tersedia di Level 3.
          </p>
        </Card>
        <Card>
          <h3 className="text-sm text-slate-500">Keranjang</h3>
          <p className="mt-1 text-sm text-slate-600">Belum tersedia (Level 3)</p>
        </Card>
        <Card>
          <h3 className="text-sm text-slate-500">Riwayat Pesanan</h3>
          <p className="mt-1 text-sm text-slate-600">Belum tersedia (Level 3)</p>
        </Card>
      </div>
    </div>
  );
}
