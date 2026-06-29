import { notFound } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import AddToCartButton from "@/components/layout/AddToCartButton";
import { prisma } from "@/lib/prisma";
import { dummyProducts } from "@/lib/dummyData";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const real = await prisma.product.findUnique({
    where: { id },
    include: { store: { select: { id: true, name: true, description: true } } },
  });

  const dummy = !real ? dummyProducts.find((p) => p.id === id) : null;

  if (!real && !dummy) return notFound();

  const product = real
    ? {
        name: real.name,
        description: real.description ?? "Tidak ada deskripsi.",
        price: real.price,
        stock: real.stock,
        imageUrl: real.imageUrl || "https://placehold.co/400x400?text=No+Image",
        storeName: real.store.name,
        storeId: real.store.id as string | null,
      }
    : {
        name: dummy!.name,
        description: dummy!.description,
        price: dummy!.price,
        stock: dummy!.stock,
        imageUrl: dummy!.imageUrl,
        storeName: dummy!.storeName,
        storeId: null,
      };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="grid gap-8 md:grid-cols-2">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full rounded-xl object-cover"
        />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Dijual oleh{" "}
            {product.storeId ? (
              <Link href={`/stores/${product.storeId}`} className="font-medium text-emerald-700 hover:underline">
                {product.storeName}
              </Link>
            ) : (
              <span className="font-medium text-emerald-700">{product.storeName}</span>
            )}
          </p>
          <p className="mt-4 text-2xl font-bold text-emerald-700">
            Rp{product.price.toLocaleString("id-ID")}
          </p>
          <p className="mt-1 text-sm text-slate-500">Stok tersedia: {product.stock}</p>

          <Card className="mt-4">
            <h3 className="font-medium text-slate-800">Deskripsi</h3>
            <p className="mt-1 text-sm text-slate-600">{product.description}</p>
          </Card>

          {/* Real add-to-cart for Buyer; disabled state handled inside the component. */}
          <AddToCartButton productId={real ? real.id : id} isDummy={!real} />
        </div>
      </div>
    </div>
  );
}
