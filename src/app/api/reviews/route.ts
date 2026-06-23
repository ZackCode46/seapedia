import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";
import { getCurrentUser } from "@/lib/auth";

const reviewSchema = z.object({
  name: z.string().min(1).max(50),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(1000),
});

// Public: anyone (guest or logged-in) can view application reviews.
export async function GET() {
  const reviews = await prisma.appReview.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, name: true, rating: true, comment: true, createdAt: true },
  });
  return NextResponse.json({ reviews });
}

// Public: guests may submit application reviews without checkout/login.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal. Nama wajib diisi, rating 1-5, komentar wajib diisi.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Sanitize before storing so stored content can never carry executable markup,
    // even if a future view renders it differently than the current plain-text UI.
    const safeName = sanitizePlainText(parsed.data.name);
    const safeComment = sanitizePlainText(parsed.data.comment);

    if (!safeName || !safeComment) {
      return NextResponse.json({ error: "Nama dan komentar tidak boleh kosong setelah sanitasi" }, { status: 400 });
    }

    const user = await getCurrentUser(); // optional: link review to account if logged in

    const review = await prisma.appReview.create({
      data: {
        userId: user?.id,
        name: safeName,
        rating: parsed.data.rating,
        comment: safeComment,
      },
    });

    return NextResponse.json({ message: "Review berhasil dikirim", review });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
