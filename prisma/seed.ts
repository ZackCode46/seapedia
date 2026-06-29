import "dotenv/config";
import { PrismaClient, RoleName } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function hash(plain: string) {
  return bcrypt.hash(plain, 10);
}

async function main() {
  // --- Admin ---
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      email: "admin@seapedia.test",
      password: await hash("admin123"),
      name: "SEAPEDIA Admin",
      roles: { create: [{ role: RoleName.ADMIN }] },
    },
  });

  // --- Seller (with store + sample products) ---
  const seller = await prisma.user.upsert({
    where: { username: "seller1" },
    update: {},
    create: {
      username: "seller1",
      email: "seller1@seapedia.test",
      password: await hash("seller123"),
      name: "Budi Penjual",
      phone: "081200000001",
      roles: { create: [{ role: RoleName.SELLER }] },
      wallet: { create: { balance: 0 } },
    },
  });

  const store = await prisma.store.upsert({
    where: { ownerId: seller.id },
    update: {},
    create: {
      ownerId: seller.id,
      name: "Toko Demo Sejahtera",
      description: "Toko contoh untuk keperluan demo & testing SEAPEDIA.",
    },
  });

  const demoProducts = [
    { name: "Kaos Polos Premium", description: "Kaos katun combed 30s, nyaman dipakai harian.", price: 75000, stock: 50 },
    { name: "Celana Jeans Slim Fit", description: "Jeans stretch, cocok untuk casual maupun semi-formal.", price: 180000, stock: 30 },
    { name: "Topi Baseball", description: "Topi adjustable, bahan katun tebal.", price: 45000, stock: 40 },
  ];
  for (const p of demoProducts) {
    const existing = await prisma.product.findFirst({ where: { storeId: store.id, name: p.name } });
    if (!existing) {
      await prisma.product.create({ data: { ...p, storeId: store.id } });
    }
  }

  // --- Buyer (with wallet balance + address) ---
  const buyer = await prisma.user.upsert({
    where: { username: "buyer1" },
    update: {},
    create: {
      username: "buyer1",
      email: "buyer1@seapedia.test",
      password: await hash("buyer123"),
      name: "Citra Pembeli",
      phone: "081200000002",
      roles: { create: [{ role: RoleName.BUYER }] },
      wallet: { create: { balance: 5_000_000 } },
    },
  });

  const existingAddress = await prisma.address.findFirst({ where: { userId: buyer.id } });
  if (!existingAddress) {
    await prisma.address.create({
      data: {
        userId: buyer.id,
        label: "Rumah",
        recipient: "Citra Pembeli",
        phone: "081200000002",
        fullAddress: "Jl. Contoh Demo No. 123",
        city: "Depok",
        isDefault: true,
      },
    });
  }

  // --- Driver ---
  await prisma.user.upsert({
    where: { username: "driver1" },
    update: {},
    create: {
      username: "driver1",
      email: "driver1@seapedia.test",
      password: await hash("driver123"),
      name: "Doni Driver",
      phone: "081200000003",
      roles: { create: [{ role: RoleName.DRIVER }] },
      driverProfile: { create: { totalEarning: 0 } },
    },
  });

  // --- Multi-role demo account (Buyer + Seller + Driver in one username) ---
  await prisma.user.upsert({
    where: { username: "multirole1" },
    update: {},
    create: {
      username: "multirole1",
      email: "multirole1@seapedia.test",
      password: await hash("multirole123"),
      name: "Eka Multi-Role",
      phone: "081200000004",
      roles: {
        create: [{ role: RoleName.BUYER }, { role: RoleName.SELLER }, { role: RoleName.DRIVER }],
      },
      wallet: { create: { balance: 1_000_000 } },
      driverProfile: { create: { totalEarning: 0 } },
    },
  });

  // --- Demo Voucher & Promo ---
  await prisma.voucher.upsert({
    where: { code: "DISKON10" },
    update: {},
    create: {
      code: "DISKON10",
      description: "Diskon 10% untuk pembelian apa saja, maks Rp20.000",
      discountType: "PERCENTAGE",
      discountValue: 10,
      maxDiscount: 20000,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usageLimit: 100,
    },
  });

  const existingPromo = await prisma.promo.findFirst({ where: { name: "Promo Pengguna Baru" } });
  if (!existingPromo) {
    await prisma.promo.create({
      data: {
        name: "Promo Pengguna Baru",
        discountType: "FLAT",
        discountValue: 15000,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    });
  }

  console.log(`
Seed selesai. Akun demo yang tersedia:
- Admin     : username=admin       password=admin123
- Seller    : username=seller1     password=seller123  (toko: "Toko Demo Sejahtera", 3 produk)
- Buyer     : username=buyer1      password=buyer123   (saldo wallet: Rp5.000.000, 1 alamat)
- Driver    : username=driver1     password=driver123
- Multi-role: username=multirole1  password=multirole123  (Buyer+Seller+Driver sekaligus)
- Voucher   : DISKON10 (10%, maks Rp20.000)
- Promo     : "Promo Pengguna Baru" (flat Rp15.000)
`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
