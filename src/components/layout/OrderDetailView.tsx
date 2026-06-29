"use client";

const statusLabel: Record<string, string> = {
  SEDANG_DIKEMAS: "Sedang Dikemas",
  MENUNGGU_PENGIRIM: "Menunggu Pengirim",
  SEDANG_DIKIRIM: "Sedang Dikirim",
  PESANAN_SELESAI: "Pesanan Selesai",
  DIKEMBALIKAN: "Dikembalikan",
};

const STATUS_ORDER = ["SEDANG_DIKEMAS", "MENUNGGU_PENGIRIM", "SEDANG_DIKIRIM", "PESANAN_SELESAI"];

export type OrderDetail = {
  id: string;
  status: string;
  deliveryMethod: string;
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  ppn: number;
  total: number;
  createdAt: string;
  store: { name: string };
  address: { label: string; recipient: string; fullAddress: string; city: string; phone: string };
  items: { id: string; quantity: number; priceEach: number; product: { name: string; imageUrl: string | null } }[];
  statusHistory: { id: string; status: string; note: string | null; createdAt: string }[];
  delivery?: { driver: { user: { name: string } } | null } | null;
};

export default function OrderDetailView({ order }: { order: OrderDetail }) {
  const isReturned = order.status === "DIKEMBALIKAN";

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-800">Status Pesanan</h2>
        {isReturned ? (
          <p className="mt-2 rounded bg-red-50 p-2 text-sm text-red-700">
            Pesanan ini dikembalikan/di-refund (overdue).
          </p>
        ) : (
          <div className="mt-3 flex items-center gap-1">
            {STATUS_ORDER.map((s, idx) => {
              const reached = STATUS_ORDER.indexOf(order.status) >= idx;
              return (
                <div key={s} className="flex flex-1 flex-col items-center">
                  <div className={`h-3 w-3 rounded-full ${reached ? "bg-emerald-600" : "bg-slate-200"}`} />
                  <p className={`mt-1 text-center text-[10px] ${reached ? "text-emerald-700" : "text-slate-400"}`}>
                    {statusLabel[s]}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        <h3 className="mt-4 text-sm font-medium text-slate-700">Riwayat Status</h3>
        <ul className="mt-2 space-y-1">
          {order.statusHistory.map((h) => (
            <li key={h.id} className="text-sm text-slate-600">
              <span className="font-medium">{statusLabel[h.status] ?? h.status}</span>
              {" — "}
              {new Date(h.createdAt).toLocaleString("id-ID")}
              {h.note && <span className="text-slate-400"> ({h.note})</span>}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-800">Toko: {order.store.name}</h2>
        <p className="text-sm text-slate-500">Metode pengiriman: {order.deliveryMethod}</p>
        {order.delivery?.driver?.user?.name && (
          <p className="text-sm text-slate-500">
            Driver: <span className="font-medium text-slate-700">{order.delivery.driver.user.name}</span>
          </p>
        )}
        <div className="mt-2 space-y-2">
          {order.items.map((it) => (
            <div key={it.id} className="flex items-center gap-3">
              <img
                src={it.product.imageUrl || "https://placehold.co/56x56?text=No+Image"}
                alt={it.product.name}
                className="h-12 w-12 rounded object-cover"
              />
              <div className="flex-1 text-sm">
                <p className="text-slate-800">{it.product.name}</p>
                <p className="text-slate-500">{it.quantity} x Rp{it.priceEach.toLocaleString("id-ID")}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-800">Alamat Pengiriman</h2>
        <p className="text-sm text-slate-600">
          {order.address.label} · {order.address.recipient} · {order.address.phone}
          <br />
          {order.address.fullAddress}, {order.address.city}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-800">Ringkasan Pembayaran</h2>
        <div className="mt-2 space-y-1 text-sm text-slate-600">
          <div className="flex justify-between"><span>Subtotal</span><span>Rp{order.subtotal.toLocaleString("id-ID")}</span></div>
          <div className="flex justify-between"><span>Diskon</span><span>-Rp{order.discountAmount.toLocaleString("id-ID")}</span></div>
          <div className="flex justify-between"><span>Biaya Pengiriman</span><span>Rp{order.deliveryFee.toLocaleString("id-ID")}</span></div>
          <div className="flex justify-between"><span>PPN 12%</span><span>Rp{order.ppn.toLocaleString("id-ID")}</span></div>
          <div className="mt-2 flex justify-between border-t pt-2 font-bold text-slate-900">
            <span>Total</span><span>Rp{order.total.toLocaleString("id-ID")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
