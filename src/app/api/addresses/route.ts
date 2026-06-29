import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { sanitizePlainText } from "@/lib/sanitize";

const addressSchema = z.object({
  label: z.string().min(1).max(30),
  recipient: z.string().min(1).max(100),
  phone: z.string().min(6).max(20).regex(/^[0-9+\-\s()]+$/, "Format nomor HP tidak valid"),
  fullAddress: z.string().min(5).max(300),
  city: z.string().min(1).max(100),
  isDefault: z.boolean().optional(),
});

export async function GET() {
  const auth = await requireRole(["BUYER"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const addresses = await prisma.address.findMany({
    where: { userId: auth.user.id },
    orderBy: { isDefault: "desc" },
  });
  return NextResponse.json({ addresses });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(["BUYER"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const parsed = addressSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Validasi gagal", details: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.isDefault) {
    await prisma.address.updateMany({
      where: { userId: auth.user.id },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.create({
    data: {
      ...parsed.data,
      label: sanitizePlainText(parsed.data.label),
      recipient: sanitizePlainText(parsed.data.recipient),
      fullAddress: sanitizePlainText(parsed.data.fullAddress),
      city: sanitizePlainText(parsed.data.city),
      userId: auth.user.id,
    },
  });
  return NextResponse.json({ message: "Alamat berhasil ditambahkan", address });
}
