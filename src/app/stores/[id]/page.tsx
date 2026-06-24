import { notFound } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const store = await prisma.store.findUnique({
    where: { id },
    include: { products: { where: { isActive: true }, orderBy: { createdAt: "desc" } } },
  });
  if (!store) return notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center gap-4">
        <img
          src={store.logoUrl || "https://placehold.co/80x80?text=Toko"}
          alt={store.name}
          className="h-16 w-16 rounded-full object-cover"
        />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{store.name}</h1>
          <p className="text-sm text-slate-600">{store.description || "Belum ada deskripsi toko."}</p>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold text-slate-800">Produk dari toko ini</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {store.products.length === 0 && (
          <p className="text-sm text-slate-500">Toko ini belum memiliki produk.</p>
        )}
        {store.products.map((p) => (
          <Link key={p.id} href={`/products/${p.id}`}>
            <Card className="h-full">
              <img
                src={p.imageUrl || "https://placehold.co/400x400?text=No+Image"}
                alt={p.name}
                className="aspect-square w-full rounded-lg object-cover"
              />
              <h3 className="mt-2 line-clamp-2 text-sm font-medium text-slate-800">{p.name}</h3>
              <p className="mt-1 font-semibold text-emerald-700">
                Rp{p.price.toLocaleString("id-ID")}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
