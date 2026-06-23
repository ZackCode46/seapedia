import { redirect } from "next/navigation";
import { getCurrentUser, getActiveRole } from "@/lib/auth";
import Card from "@/components/ui/Card";

export default async function SellerDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const activeRole = await getActiveRole();
  if (activeRole !== "SELLER") redirect("/select-role");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard Seller</h1>
      <p className="text-sm text-slate-500">
        Role aktif: <span className="font-medium text-emerald-700">{activeRole}</span> ·
        Semua role yang kamu miliki: {user.roles.map((r) => r.role).join(", ")}
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <h3 className="text-sm text-slate-500">Toko</h3>
          <p className="mt-1 text-lg font-semibold text-slate-800">
            {user.store ? user.store.name : "Belum membuat toko"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Pembuatan toko &amp; manajemen produk tersedia di Level 2.
          </p>
        </Card>
        <Card>
          <h3 className="text-sm text-slate-500">Pesanan Masuk</h3>
          <p className="mt-1 text-sm text-slate-600">Belum tersedia (Level 3)</p>
        </Card>
        <Card>
          <h3 className="text-sm text-slate-500">Pendapatan</h3>
          <p className="mt-1 text-sm text-slate-600">Belum tersedia (Level 4)</p>
        </Card>
      </div>
    </div>
  );
}
