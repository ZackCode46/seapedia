// Used at Level 1 when the product/store backend isn't wired up yet.
// From Level 2 onward, /products and /products/[id] should fetch real data
// from /api/products and fall back to this only if the API has no results.

export type DummyProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  storeName: string;
};

export const dummyProducts: DummyProduct[] = [
  {
    id: "dummy-1",
    name: "Kemeja Linen Pria",
    description: "Kemeja linen lengan panjang, nyaman dipakai harian, tersedia berbagai ukuran.",
    price: 149000,
    stock: 25,
    imageUrl: "https://placehold.co/400x400?text=Kemeja+Linen",
    storeName: "Toko Busana Nusantara",
  },
  {
    id: "dummy-2",
    name: "Sepatu Sneakers Putih",
    description: "Sneakers casual unisex, sol empuk, cocok untuk aktivitas sehari-hari.",
    price: 320000,
    stock: 12,
    imageUrl: "https://placehold.co/400x400?text=Sneakers",
    storeName: "Toko Footwear Jaya",
  },
  {
    id: "dummy-3",
    name: "Tas Ransel Laptop",
    description: "Tas ransel anti air dengan kompartemen laptop 15 inch dan banyak kantong.",
    price: 215000,
    stock: 18,
    imageUrl: "https://placehold.co/400x400?text=Tas+Ransel",
    storeName: "Toko Gadget Aksesoris",
  },
  {
    id: "dummy-4",
    name: "Smartwatch Fitness Tracker",
    description: "Smartwatch dengan fitur pelacak detak jantung, langkah, dan notifikasi.",
    price: 459000,
    stock: 8,
    imageUrl: "https://placehold.co/400x400?text=Smartwatch",
    storeName: "Toko Gadget Aksesoris",
  },
];
