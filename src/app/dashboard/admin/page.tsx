import { redirect } from "next/navigation";
import { getCurrentUser, getActiveRole } from "@/lib/auth";
import Card from "@/components/ui/Card";

export default async function AdminDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const activeRole = await getActiveRole();
  if (activeRole !== "ADMIN") redirect("/select-role");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard Admin</h1>
      <p className="text-sm text-slate-500">
        Login sebagai <span className="font-medium text-emerald-700">Admin</span>.
        Akun Admin dibuat lewat seed data (lihat README), bukan lewat form registrasi publik.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card><h3 className="text-sm text-slate-500">Monitoring Users/Stores</h3><p className="mt-1 text-sm text-slate-600">Belum tersedia (Level 6)</p></Card>
        <Card><h3 className="text-sm text-slate-500">Voucher &amp; Promo</h3><p className="mt-1 text-sm text-slate-600">Belum tersedia (Level 4/6)</p></Card>
        <Card><h3 className="text-sm text-slate-500">Overdue Handling</h3><p className="mt-1 text-sm text-slate-600">Belum tersedia (Level 6)</p></Card>
      </div>
    </div>
  );
}
