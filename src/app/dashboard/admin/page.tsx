import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getActiveRole } from "@/lib/auth";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default async function AdminDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const activeRole = await getActiveRole();
  if (activeRole !== "ADMIN") redirect("/select-role");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Admin</h1>
          <p className="text-sm text-slate-500">
            Login sebagai <span className="font-medium text-emerald-700">Admin</span>.
            Akun Admin dibuat lewat seed data (lihat README), bukan lewat form registrasi publik.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/admin/monitoring"><Button variant="outline">Monitoring</Button></Link>
          <Link href="/dashboard/admin/vouchers"><Button variant="outline">Kelola Voucher</Button></Link>
          <Link href="/dashboard/admin/promos"><Button variant="outline">Kelola Promo</Button></Link>
          <Link href="/dashboard/admin/overdue"><Button>Overdue</Button></Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/admin/monitoring"><Card><h3 className="text-sm text-slate-500">Monitoring Users/Stores</h3><p className="mt-1 text-sm text-emerald-700">Lihat dashboard &rarr;</p></Card></Link>
        <Link href="/dashboard/admin/vouchers"><Card><h3 className="text-sm text-slate-500">Voucher &amp; Promo</h3><p className="mt-1 text-sm text-emerald-700">Kelola sekarang &rarr;</p></Card></Link>
        <Link href="/dashboard/admin/overdue"><Card><h3 className="text-sm text-slate-500">Overdue Handling</h3><p className="mt-1 text-sm text-emerald-700">Simulasi & jalankan &rarr;</p></Card></Link>
      </div>
    </div>
  );
}
