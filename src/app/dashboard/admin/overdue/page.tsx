"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

type RunResult = { orderId: string; refundedAmount: number };

export default function AdminOverduePage() {
  const [simulatedNow, setSimulatedNow] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<{ message: string; results: RunResult[] } | null>(null);
  const router = useRouter();

  async function loadClock() {
    const res = await fetch("/api/admin/system-clock");
    if (res.status === 401 || res.status === 403) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    setSimulatedNow(data.simulatedNow);
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      await loadClock();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAdvanceDay() {
    setAdvancing(true);
    try {
      const res = await fetch("/api/admin/system-clock/advance-day", { method: "POST" });
      const data = await res.json();
      setSimulatedNow(data.simulatedNow);
    } finally {
      setAdvancing(false);
    }
  }

  async function handleRunOverdue() {
    setRunning(true);
    try {
      const res = await fetch("/api/admin/overdue/run", { method: "POST" });
      const data = await res.json();
      setLastRun(data);
    } finally {
      setRunning(false);
    }
  }

  if (loading) return <p className="px-4 py-16 text-center text-slate-500">Memuat...</p>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Overdue Handling</h1>
      <p className="mt-1 text-sm text-slate-600">
        Order yang melebihi SLA pengiriman (lihat README untuk aturan jam per metode)
        akan otomatis dikembalikan: saldo Buyer di-refund, stok produk dikembalikan,
        dan pendapatan Seller untuk order itu tidak lagi dihitung.
      </p>

      <Card className="mt-4">
        <h2 className="font-semibold text-slate-800">Simulasi Waktu</h2>
        <p className="mt-1 text-sm text-slate-600">
          Waktu sistem saat ini (simulasi): <span className="font-medium">{simulatedNow && new Date(simulatedNow).toLocaleString("id-ID")}</span>
        </p>
        <Button className="mt-3" onClick={handleAdvanceDay} disabled={advancing}>
          {advancing ? "Memajukan..." : "Majukan 1 Hari"}
        </Button>
      </Card>

      <Card className="mt-4">
        <h2 className="font-semibold text-slate-800">Jalankan Pengecekan Overdue</h2>
        <p className="mt-1 text-sm text-slate-600">
          Memeriksa semua order yang belum selesai dan melebihi SLA, lalu otomatis
          refund/return. Aman dijalankan berulang — order yang sudah diproses tidak
          akan diproses dua kali.
        </p>
        <Button className="mt-3" onClick={handleRunOverdue} disabled={running}>
          {running ? "Memproses..." : "Jalankan Sekarang"}
        </Button>

        {lastRun && (
          <div className="mt-4 rounded-lg bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-800">{lastRun.message}</p>
            {lastRun.results.length > 0 && (
              <ul className="mt-2 space-y-1">
                {lastRun.results.map((r) => (
                  <li key={r.orderId} className="text-sm text-slate-600">
                    Order <span className="font-mono text-xs">{r.orderId}</span> — refund Rp{r.refundedAmount.toLocaleString("id-ID")}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
