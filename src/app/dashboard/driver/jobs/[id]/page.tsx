"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

type Job = {
  id: string;
  status: string;
  earning: number;
  driver: { user: { name: string } } | null;
  order: {
    id: string;
    deliveryMethod: string;
    total: number;
    store: { name: string };
    address: { recipient: string; phone: string; fullAddress: string; city: string };
    items: { quantity: number; product: { name: string; imageUrl: string | null } }[];
  };
};

const methodLabel: Record<string, string> = { INSTANT: "Instant", NEXT_DAY: "Next Day", REGULAR: "Regular" };

export default function DriverJobDetailPage() {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const params = useParams<{ id: string }>();

  async function load() {
    const res = await fetch(`/api/driver/jobs/${params.id}`);
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Gagal memuat job");
      setLoading(false);
      return;
    }
    setJob(data.job);
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleTake() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/driver/jobs/${params.id}/take`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal mengambil job");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/driver/jobs/${params.id}/complete`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal menyelesaikan job");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="px-4 py-16 text-center text-slate-500">Memuat...</p>;
  if (error && !job) return <p className="px-4 py-16 text-center text-red-600">{error}</p>;
  if (!job) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Detail Job Pengantaran</h1>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <Card className="mt-4">
        <p className="font-semibold text-slate-800">{job.order.store.name}</p>
        <p className="text-sm text-slate-500">
          {methodLabel[job.order.deliveryMethod]} · Status: {job.status}
        </p>
        <p className="mt-2 text-sm font-semibold text-emerald-700">
          Fee untuk Driver: Rp{job.earning.toLocaleString("id-ID")}
        </p>
      </Card>

      <Card className="mt-4">
        <h2 className="font-semibold text-slate-800">Alamat Tujuan</h2>
        <p className="mt-1 text-sm text-slate-600">
          {job.order.address.recipient} · {job.order.address.phone}
          <br />
          {job.order.address.fullAddress}, {job.order.address.city}
        </p>
      </Card>

      <Card className="mt-4">
        <h2 className="font-semibold text-slate-800">Item</h2>
        <div className="mt-2 space-y-1 text-sm text-slate-600">
          {job.order.items.map((it, idx) => (
            <p key={idx}>{it.product.name} x{it.quantity}</p>
          ))}
        </div>
      </Card>

      <div className="mt-4">
        {job.status === "WAITING_DRIVER" && (
          <Button fullWidth onClick={handleTake} disabled={busy}>
            {busy ? "Mengambil..." : "Ambil Job Ini"}
          </Button>
        )}
        {job.status === "ON_DELIVERY" && (
          <Button fullWidth onClick={handleComplete} disabled={busy}>
            {busy ? "Memproses..." : "Konfirmasi Pesanan Selesai Diantar"}
          </Button>
        )}
        {job.status === "COMPLETED" && (
          <p className="text-center text-sm text-emerald-600">Job ini sudah selesai diantar.</p>
        )}
      </div>
    </div>
  );
}
