import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { sanitizePlainText } from "@/lib/sanitize";

const storeSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().max(500).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
});

// Seller creates or updates their own store (one store per seller).
export async function POST(req: NextRequest) {
  const auth = await requireRole(["SELLER"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const parsed = storeSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Validasi gagal", details: parsed.error.flatten() }, { status: 400 });
  }
  // Sanitize free-text fields before storing — defense-in-depth on top of
  // React's default escaping when these are rendered on store/product pages.
  const name = sanitizePlainText(parsed.data.name);
  const description = parsed.data.description ? sanitizePlainText(parsed.data.description) : undefined;
  const { logoUrl } = parsed.data;

  if (!name) {
    return NextResponse.json({ error: "Nama toko tidak boleh kosong" }, { status: 400 });
  }

  const existingByName = await prisma.store.findUnique({ where: { name } });
  if (existingByName && existingByName.ownerId !== auth.user.id) {
    return NextResponse.json({ error: "Nama toko sudah digunakan, silakan pilih nama lain" }, { status: 409 });
  }

  const store = await prisma.store.upsert({
    where: { ownerId: auth.user.id },
    update: { name, description, logoUrl: logoUrl || null },
    create: { ownerId: auth.user.id, name, description, logoUrl: logoUrl || null },
  });

  return NextResponse.json({ message: "Toko berhasil disimpan", store });
}

// Seller fetches their own store profile to prefill the edit form.
export async function GET() {
  const auth = await requireRole(["SELLER"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const store = await prisma.store.findUnique({ where: { ownerId: auth.user.id } });
  return NextResponse.json({ store });
}
