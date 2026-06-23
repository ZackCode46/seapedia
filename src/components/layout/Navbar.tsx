"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../ui/Button";

type Me = {
  id: string;
  username: string;
  name: string;
  roles: string[];
  activeRole: string | null;
  needsRoleSelection: boolean;
} | null;

const dashboardPath: Record<string, string> = {
  ADMIN: "/dashboard/admin",
  SELLER: "/dashboard/seller",
  BUYER: "/dashboard/buyer",
  DRIVER: "/dashboard/driver",
};

export default function Navbar() {
  const [me, setMe] = useState<Me>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d.user))
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-emerald-700">
          SEAPEDIA
        </Link>

        <button
          className="block md:hidden"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="text-2xl">☰</span>
        </button>

        <div className="hidden items-center gap-4 md:flex">
          <Link href="/products" className="text-sm text-slate-700 hover:text-emerald-700">
            Produk
          </Link>
          <Link href="/#reviews" className="text-sm text-slate-700 hover:text-emerald-700">
            Review Aplikasi
          </Link>

          {!loading && !me && (
            <>
              <Link href="/login">
                <Button variant="outline">Masuk</Button>
              </Link>
              <Link href="/register">
                <Button>Daftar</Button>
              </Link>
            </>
          )}

          {!loading && me && (
            <>
              {me.needsRoleSelection ? (
                <Link href="/select-role">
                  <Button variant="outline">Pilih Role</Button>
                </Link>
              ) : me.activeRole ? (
                <Link href={dashboardPath[me.activeRole] ?? "/"}>
                  <Button variant="outline">
                    Dashboard ({me.activeRole})
                  </Button>
                </Link>
              ) : null}
              <span className="text-sm text-slate-600">Hai, {me.name}</span>
              <Button variant="ghost" onClick={handleLogout}>
                Keluar
              </Button>
            </>
          )}
        </div>
      </nav>

      {menuOpen && (
        <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 md:hidden">
          <Link href="/products" onClick={() => setMenuOpen(false)}>
            Produk
          </Link>
          <Link href="/#reviews" onClick={() => setMenuOpen(false)}>
            Review Aplikasi
          </Link>
          {!loading && !me && (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)}>
                Masuk
              </Link>
              <Link href="/register" onClick={() => setMenuOpen(false)}>
                Daftar
              </Link>
            </>
          )}
          {!loading && me && (
            <>
              {me.needsRoleSelection ? (
                <Link href="/select-role" onClick={() => setMenuOpen(false)}>
                  Pilih Role
                </Link>
              ) : me.activeRole ? (
                <Link href={dashboardPath[me.activeRole] ?? "/"} onClick={() => setMenuOpen(false)}>
                  Dashboard ({me.activeRole})
                </Link>
              ) : null}
              <button onClick={handleLogout} className="text-left text-red-600">
                Keluar
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
