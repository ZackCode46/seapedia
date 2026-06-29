"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

type Tx = { id: string; type: string; amount: number; note: string | null; createdAt: string };
type Wallet = { balance: number; transactions: Tx[] };

const txLabel: Record<string, string> = {
  TOPUP: "Top-up",
  CHECKOUT_PAYMENT: "Pembayaran Checkout",
  REFUND: "Refund",
};

export default function BuyerWalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("100000");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function load() {
    const res = await fetch("/api/wallet");
    if (res.status === 401 || res.status === 403) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    setWallet(data.wallet);
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleTopup(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Top-up gagal");
        return;
      }
      load();
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="px-4 py-16 text-center text-slate-500">Memuat...</p>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Wallet Saya</h1>

      <Card className="mt-4">
        <p className="text-sm text-slate-500">Saldo saat ini</p>
        <p className="text-3xl font-bold text-emerald-700">
          Rp{(wallet?.balance ?? 0).toLocaleString("id-ID")}
        </p>

        <form onSubmit={handleTopup} className="mt-4 flex gap-2">
          <Input
            type="number"
            min={1000}
            step={1000}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={submitting}>
            {submitting ? "Memproses..." : "Top-up (dummy)"}
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <p className="mt-2 text-xs text-slate-400">
          Top-up ini simulasi, tidak terhubung ke payment gateway sungguhan.
        </p>
      </Card>

      <h2 className="mt-6 font-semibold text-slate-800">Riwayat Transaksi</h2>
      <div className="mt-2 space-y-2">
        {(wallet?.transactions.length ?? 0) === 0 && (
          <p className="text-sm text-slate-500">Belum ada transaksi.</p>
        )}
        {wallet?.transactions.map((tx) => (
          <Card key={tx.id} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800">{txLabel[tx.type] ?? tx.type}</p>
              <p className="text-xs text-slate-400">{new Date(tx.createdAt).toLocaleString("id-ID")}</p>
              {tx.note && <p className="text-xs text-slate-500">{tx.note}</p>}
            </div>
            <p className={`font-semibold ${tx.amount >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {tx.amount >= 0 ? "+" : ""}Rp{tx.amount.toLocaleString("id-ID")}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
