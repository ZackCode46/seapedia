import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["BUYER"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { id } = await params;
  const address = await prisma.address.findUnique({ where: { id } });
  if (!address || address.userId !== auth.user.id) {
    return NextResponse.json({ error: "Alamat tidak ditemukan" }, { status: 404 });
  }

  await prisma.address.delete({ where: { id } });
  return NextResponse.json({ message: "Alamat berhasil dihapus" });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["BUYER"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { id } = await params;
  const address = await prisma.address.findUnique({ where: { id } });
  if (!address || address.userId !== auth.user.id) {
    return NextResponse.json({ error: "Alamat tidak ditemukan" }, { status: 404 });
  }

  const body = await req.json();
  if (body.isDefault) {
    await prisma.address.updateMany({
      where: { userId: auth.user.id },
      data: { isDefault: false },
    });
  }

  const updated = await prisma.address.update({ where: { id }, data: body });
  return NextResponse.json({ message: "Alamat berhasil diperbarui", address: updated });
}
