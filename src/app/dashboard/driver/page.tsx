import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getActiveRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const methodLabel: Record<string, string> = { INSTANT: "Instant", NEXT_DAY: "Next Day", REGULAR: "Regular" };

export default async function DriverDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const activeRole = await getActiveRole();
  if (activeRole !== "DRIVER") redirect("/select-role");

  const driverProfile = await prisma.driverProfile.findUnique({ where: { userId: user.id } });
  const activeJob = driverProfile
    ? await prisma.delivery.findFirst({
        where: { driverId: driverProfile.id, status: "ON_DELIVERY" },
        include: { order: { include: { store: { select: { name: true } } } } },
      })
    : null;
  const completedCount = driverProfile
    ? await prisma.delivery.count({ where: { driverId: driverProfile.id, status: "COMPLETED" } })
    : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Driver</h1>
          <p className="text-sm text-slate-500">
            Role aktif: <span className="font-medium text-emerald-700">{activeRole}</span> ·
            Semua role yang kamu miliki: {user.roles.map((r) => r.role).join(", ")}
          </p>
        </div>
        <Link href="/dashboard/driver/jobs"><Button>Cari Job</Button></Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <h3 className="text-sm text-slate-500">Job Aktif</h3>
          {activeJob ? (
            <>
              <p className="mt-1 text-sm font-medium text-slate-800">{activeJob.order.store.name}</p>
              <p className="text-xs text-slate-400">{methodLabel[activeJob.order.deliveryMethod]}</p>
              <Link href={`/dashboard/driver/jobs/${activeJob.id}`} className="mt-2 inline-block text-sm text-emerald-700 hover:underline">
                Lihat detail &rarr;
              </Link>
            </>
          ) : (
            <p className="mt-1 text-sm text-slate-600">Tidak ada job aktif</p>
          )}
        </Card>
        <Card>
          <h3 className="text-sm text-slate-500">Job Selesai</h3>
          <p className="mt-1 text-xl font-bold text-slate-800">{completedCount}</p>
        </Card>
        <Card>
          <h3 className="text-sm text-slate-500">Total Pendapatan</h3>
          <p className="mt-1 text-xl font-bold text-emerald-700">
            Rp{(driverProfile?.totalEarning ?? 0).toLocaleString("id-ID")}
          </p>
        </Card>
      </div>
    </div>
  );
}
