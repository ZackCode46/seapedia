"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const dashboardPath: Record<string, string> = {
  ADMIN: "/dashboard/admin",
  SELLER: "/dashboard/seller",
  BUYER: "/dashboard/buyer",
  DRIVER: "/dashboard/driver",
};

const roleLabel: Record<string, string> = {
  ADMIN: "Admin",
  SELLER: "Seller (Penjual)",
  BUYER: "Buyer (Pembeli)",
  DRIVER: "Driver (Pengantar)",
};

export default function SelectRolePage() {
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) {
          router.push("/login");
          return;
        }
        setRoles(d.user.roles);
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function pickRole(role: string) {
    setSubmitting(role);
    const res = await fetch("/api/auth/select-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      router.push(dashboardPath[role] ?? "/");
      router.refresh();
    }
    setSubmitting(null);
  }

  if (loading) {
    return <p className="px-4 py-16 text-center text-slate-500">Memuat...</p>;
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">Pilih Role Aktif</h1>
        <p className="mt-1 text-sm text-slate-600">
          Akunmu memiliki lebih dari satu role. Pilih role yang ingin digunakan
          untuk sesi ini. Hak akses akan mengikuti role yang dipilih.
        </p>
        <div className="mt-4 space-y-2">
          {roles.map((role) => (
            <Button
              key={role}
              fullWidth
              variant="outline"
              disabled={submitting !== null}
              onClick={() => pickRole(role)}
            >
              {submitting === role ? "Memproses..." : roleLabel[role] ?? role}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
