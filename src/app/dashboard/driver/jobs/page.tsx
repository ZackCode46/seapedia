"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

type Job = {
  id: string;
  earning: number;
  order: {
    id: string;
    deliveryMethod: string;
    total: number;
    store: { name: string };
    address: { city: string; fullAddress: string };
    items: { quantity: number }[];
  };
};

const methodLabel: Record<string, string> = { INSTANT: "Instant", NEXT_DAY: "Next Day", REGULAR: "Regular" };

export default function DriverJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [takingId, setTakingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  async function load() {
    const res = await fetch("/api/driver/jobs");
    if (res.status === 401 || res.status === 403) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    setJobs(data.jobs ?? []);
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleTake(jobId: string) {
    setTakingId(jobId);
    setError("");
    try {
      const res = await fetch(`/api/driver/jobs/${jobId}/take`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal mengambil job");
        await load();
        return;
      }
      router.push(`/dashboard/driver/jobs/${jobId}`);
    } finally {
      setTakingId(null);
    }
  }

  if (loading) return <p className="px-4 py-16 text-center text-slate-500">Memuat...</p>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Cari Job Pengantaran</h1>
        <Link href="/dashboard/driver"><Button variant="outline">Kembali</Button></Link>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Hanya pesanan yang sudah diproses Seller (status Menunggu Pengirim) yang muncul di sini.
      </p>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 space-y-3">
        {jobs.length === 0 && <p className="text-sm text-slate-500">Belum ada job tersedia saat ini.</p>}
        {jobs.map((j) => (
          <Card key={j.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800">{j.order.store.name}</p>
              <p className="text-sm text-slate-500">
                {methodLabel[j.order.deliveryMethod]} · {j.order.items.reduce((s, i) => s + i.quantity, 0)} item
              </p>
              <p className="text-sm text-slate-500">{j.order.address.city}</p>
              <p className="mt-1 text-sm font-semibold text-emerald-700">
                Estimasi fee: Rp{j.earning.toLocaleString("id-ID")}
              </p>
            </div>
            <Button onClick={() => handleTake(j.id)} disabled={takingId === j.id}>
              {takingId === j.id ? "Mengambil..." : "Ambil Job"}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
