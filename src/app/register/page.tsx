"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const ROLE_OPTIONS = [
  { value: "BUYER", label: "Buyer (Pembeli)" },
  { value: "SELLER", label: "Seller (Penjual)" },
  { value: "DRIVER", label: "Driver (Pengantar)" },
];

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    name: "",
    phone: "",
    password: "",
  });
  const [roles, setRoles] = useState<string[]>(["BUYER"]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function toggleRole(role: string) {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (roles.length === 0) {
      setError("Pilih minimal satu role: Buyer, Seller, atau Driver");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, roles }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registrasi gagal");
        return;
      }
      router.push("/login");
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
      <Card className="w-full">
        <h1 className="text-xl font-bold text-slate-900">Daftar di SEAPEDIA</h1>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <Input
            label="Nama Lengkap"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label="No. HP"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
          />

          <div>
            <label className="text-sm font-medium text-slate-700">
              Role (boleh pilih lebih dari satu)
            </label>
            <div className="mt-1 space-y-1">
              {ROLE_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={roles.includes(opt.value)}
                    onChange={() => toggleRole(opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Satu username bisa memiliki lebih dari satu role non-admin sekaligus.
              Kamu akan memilih role aktif setiap kali login jika punya lebih dari satu.
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Memproses..." : "Daftar"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-emerald-700 hover:underline">
            Masuk di sini
          </Link>
        </p>
      </Card>
    </div>
  );
}
