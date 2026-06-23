"use client";

import { useEffect, useState, FormEvent } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Card from "../ui/Card";

type Review = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export default function AppReviewSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  async function loadReviews() {
    setLoading(true);
    const res = await fetch("/api/reviews");
    const data = await res.json();
    setReviews(data.reviews ?? []);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const res = await fetch("/api/reviews");
      const data = await res.json();
      if (active) {
        setReviews(data.reviews ?? []);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal mengirim review");
        return;
      }
      setSuccess("Terima kasih atas review-nya!");
      setName("");
      setRating(5);
      setComment("");
      loadReviews();
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="reviews" className="mx-auto max-w-6xl px-4 py-12">
      <h2 className="text-2xl font-bold text-slate-900">Apa Kata Pengguna</h2>
      <p className="mt-1 text-sm text-slate-600">
        Bagikan pengalaman kamu menggunakan aplikasi SEAPEDIA. Tidak perlu checkout
        atau punya riwayat transaksi untuk memberi review.
      </p>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="Nama"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama kamu"
            required
            maxLength={50}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setRating(n)}
                  className={`text-2xl ${n <= rating ? "text-amber-500" : "text-slate-300"}`}
                  aria-label={`Beri rating ${n}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Komentar</label>
            <textarea
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              rows={4}
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ceritakan pengalaman kamu memakai SEAPEDIA..."
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-emerald-600">{success}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Mengirim..." : "Kirim Review"}
          </Button>
        </form>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {loading && <p className="text-sm text-slate-500">Memuat review...</p>}
          {!loading && reviews.length === 0 && (
            <p className="text-sm text-slate-500">Belum ada review. Jadilah yang pertama!</p>
          )}
          {reviews.map((r) => (
            <Card key={r.id}>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-800">{r.name}</span>
                <span className="text-amber-500">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
              </div>
              {/* Rendered as plain text node (React escapes by default) and the
                  content is already sanitized server-side before storage. */}
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{r.comment}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
