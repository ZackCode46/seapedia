"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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

const roleBadgeColor: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  SELLER: "bg-blue-100 text-blue-700",
  BUYER: "bg-emerald-100 text-emerald-700",
  DRIVER: "bg-amber-100 text-amber-700",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Navbar() {
  const [me, setMe] = useState<Me>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const router = useRouter();
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // A hard timeout guarantees the navbar always resolves to a usable state
    // (showing Masuk/Daftar) even if the API hangs due to a DB connection issue,
    // instead of leaving the account area blank forever.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    fetch("/api/auth/me", { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => setMe(d.user ?? null))
      .catch(() => setMe(null))
      .finally(() => {
        clearTimeout(timeout);
        setLoading(false);
      });

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null);
    setAccountOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-1.5 text-xl font-bold text-emerald-700">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-sm text-white">S</span>
          SEAPEDIA
        </Link>

        <button
          className="block md:hidden"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="text-2xl">☰</span>
        </button>

        <div className="hidden items-center gap-5 md:flex">
          <Link href="/products" className="text-sm font-medium text-slate-600 hover:text-emerald-700">
            Produk
          </Link>
          <Link href="/#reviews" className="text-sm font-medium text-slate-600 hover:text-emerald-700">
            Review
          </Link>
          {!loading && me?.activeRole === "BUYER" && (
            <Link href="/cart" className="text-sm font-medium text-slate-600 hover:text-emerald-700">
              Keranjang
            </Link>
          )}

          {loading && <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-100" />}

          {!loading && !me && (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="outline">Masuk</Button>
              </Link>
              <Link href="/register">
                <Button>Daftar</Button>
              </Link>
            </div>
          )}

          {!loading && me && (
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setAccountOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-slate-200 px-2 py-1 pr-3 hover:bg-slate-50"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
                  {initials(me.name)}
                </span>
                <span className="text-sm font-medium text-slate-700">{me.name.split(" ")[0]}</span>
                {me.activeRole && (
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${roleBadgeColor[me.activeRole]}`}>
                    {me.activeRole}
                  </span>
                )}
              </button>

              {accountOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-slate-800">{me.name}</p>
                    <p className="text-xs text-slate-400">@{me.username}</p>
                  </div>
                  <div className="my-1 border-t border-slate-100" />
                  {me.needsRoleSelection ? (
                    <Link
                      href="/select-role"
                      onClick={() => setAccountOpen(false)}
                      className="block rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Pilih Role Aktif
                    </Link>
                  ) : me.activeRole ? (
                    <Link
                      href={dashboardPath[me.activeRole] ?? "/"}
                      onClick={() => setAccountOpen(false)}
                      className="block rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Dashboard {me.activeRole}
                    </Link>
                  ) : null}
                  {me.roles.length > 1 && (
                    <Link
                      href="/select-role"
                      onClick={() => setAccountOpen(false)}
                      className="block rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Ganti Role
                    </Link>
                  )}
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    onClick={handleLogout}
                    className="block w-full rounded-lg px-2 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Keluar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {menuOpen && (
        <div className="flex flex-col gap-1 border-t border-slate-200 px-4 py-3 md:hidden">
          <Link href="/products" onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-2 text-sm hover:bg-slate-50">
            Produk
          </Link>
          <Link href="/#reviews" onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-2 text-sm hover:bg-slate-50">
            Review Aplikasi
          </Link>
          {!loading && !me && (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-2 text-sm hover:bg-slate-50">
                Masuk
              </Link>
              <Link href="/register" onClick={() => setMenuOpen(false)} className="rounded-lg bg-emerald-600 px-2 py-2 text-sm text-white">
                Daftar
              </Link>
            </>
          )}
          {!loading && me && (
            <>
              <div className="px-2 py-1 text-sm text-slate-500">
                Masuk sebagai <span className="font-medium text-slate-800">{me.name}</span>
                {me.activeRole && ` · ${me.activeRole}`}
              </div>
              {me.activeRole === "BUYER" && (
                <Link href="/cart" onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-2 text-sm hover:bg-slate-50">
                  Keranjang
                </Link>
              )}
              {me.needsRoleSelection ? (
                <Link href="/select-role" onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-2 text-sm hover:bg-slate-50">
                  Pilih Role
                </Link>
              ) : me.activeRole ? (
                <Link href={dashboardPath[me.activeRole] ?? "/"} onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-2 text-sm hover:bg-slate-50">
                  Dashboard ({me.activeRole})
                </Link>
              ) : null}
              {me.roles.length > 1 && (
                <Link href="/select-role" onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-2 text-sm hover:bg-slate-50">
                  Ganti Role
                </Link>
              )}
              <button onClick={handleLogout} className="rounded-lg px-2 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                Keluar
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
