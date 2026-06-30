# SEAPEDIA

Marketplace multi-role (Admin, Seller, Buyer, Driver) — dikerjakan bertahap sesuai
level di soal Technical Challenge SEAPEDIA.

**Status progres saat ini: Level 1-7 selesai (100/100 poin inti).** Lihat
[`docs/TESTING_GUIDE.md`](./docs/TESTING_GUIDE.md) untuk panduan demo end-to-end,
[`docs/API_DOCUMENTATION.md`](./docs/API_DOCUMENTATION.md) untuk dokumentasi API, dan
[`docs/SECURITY.md`](./docs/SECURITY.md) untuk catatan keamanan lengkap.

### Perbaikan Bug Navbar (Account Section Hilang)

Sebelumnya, kalau koneksi ke database lambat/timeout, bagian "Masuk/Daftar" di navbar
bisa hilang total karena status loading tidak pernah selesai. Sudah diperbaiki dengan:
- Timeout 5 detik + `catch()` di fetch `/api/auth/me` (`src/components/layout/Navbar.tsx`),
  jadi navbar selalu jatuh ke tampilan "Masuk/Daftar" kalau API gagal merespons.
- `connectionTimeoutMillis` pada koneksi PostgreSQL (`src/lib/prisma.ts`), supaya kalau
  database tidak bisa dihubungi, error langsung muncul jelas di terminal `npm run dev`
  daripada request menggantung diam-diam.
- Navbar juga dirombak jadi dropdown akun (avatar + badge role) yang lebih rapi
  dibanding sebelumnya yang menumpuk banyak tombol sejajar.

**Akar masalah sebenarnya** (ditemukan setelah investigasi lebih lanjut): kalau dev
server diakses lewat alamat network/IP (misal `http://192.168.x.x:3000`) bukan
`localhost:3000`, Next.js secara default **memblokir semua request cross-origin di
mode development** — termasuk `fetch()` ke `/api/auth/me` dari browser — demi keamanan
(mencegah DNS rebinding attack). Request yang diblokir ini tidak muncul di log
terminal sama sekali, makanya terlihat seperti "menggantung diam-diam". Sudah
diperbaiki dengan menambahkan `allowedDevOrigins` di `next.config.ts`. Kalau kamu
mengakses dari IP lain (misal HP di jaringan WiFi yang sama), tambahkan IP tersebut
ke array `allowedDevOrigins` juga.



## Stack

- Next.js 16 (App Router, TypeScript, Tailwind CSS) — frontend & backend (API routes) jadi satu app
- PostgreSQL + Prisma ORM
- bcryptjs untuk hashing password
- jsonwebtoken untuk session token (httpOnly cookie)
- zod untuk validasi input
- isomorphic-dompurify untuk sanitasi input publik (anti-XSS, dipersiapkan dari Level 1)

## Catatan Versi Prisma 7

Project ini pakai **Prisma 7**, yang punya breaking change besar dibanding versi
sebelumnya: connection URL database sekarang dikonfigurasi di `prisma.config.ts`
(bukan lagi di `datasource.url` pada `schema.prisma`), dan `PrismaClient` wajib
diinisialisasi dengan driver adapter (`@prisma/adapter-pg` untuk PostgreSQL). Ini
sudah diatur di `prisma.config.ts`, `src/lib/prisma.ts`, dan `prisma/seed.ts` — kamu
tidak perlu mengubah apa pun, cukup pastikan `DATABASE_URL` di `.env` benar.

Saat `npm install`, npm mungkin menampilkan warning `allow-scripts` untuk paket
`@prisma/engines`, `prisma`, dan `sharp` (mereka butuh menjalankan install script
untuk download engine binary). Kalau prisma generate/migrate gagal karena ini,
jalankan:
```bash
npm approve-scripts --allow-scripts-pending
```
lalu ulangi `npm install`.

## Deploy ke Vercel

- `package.json` punya script `postinstall: prisma generate`, jadi Prisma Client
  selalu ter-generate ulang otomatis setiap kali Vercel install dependency —
  tidak perlu langkah manual tambahan untuk ini.
- `tsconfig.json` mengecualikan folder `prisma/` dari typecheck Next.js
  (`prisma/seed.ts` dijalankan terpisah lewat `ts-node`, bukan bagian dari bundle
  aplikasi, jadi tidak perlu ikut di-typecheck saat `next build`).
- **Wajib** set environment variable `DATABASE_URL` dan `JWT_SECRET` di pengaturan
  project Vercel (Settings → Environment Variables) — gunakan connection string dari
  database cloud (misal Neon, Supabase, atau Vercel Postgres), karena PostgreSQL
  lokal di laptop tidak bisa diakses dari internet.
- Setelah set environment variable, jalankan migrasi ke database production sekali
  dari lokal (ganti `DATABASE_URL` di `.env` lokal ke connection string production
  sementara): `npx prisma migrate deploy` lalu `npm run db:seed` kalau mau ada akun
  demo juga di production.

## Setup

1. Install dependency:
   ```bash
   npm install
   ```
2. Siapkan database PostgreSQL, lalu copy env:
   ```bash
   cp .env.example .env
   # isi DATABASE_URL dan JWT_SECRET di .env
   ```
3. Generate Prisma client & jalankan migrasi:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```
4. Seed akun Admin (lihat bagian "Akun Demo" di bawah):
   ```bash
   npm run db:seed
   ```
5. Jalankan dev server:
   ```bash
   npm run dev
   ```
6. Buka `http://localhost:3000`

## Environment Variables

| Variable | Keterangan |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL |
| `JWT_SECRET` | Secret untuk sign/verify JWT session token |
| `JWT_EXPIRES_IN` | Masa berlaku token, default `7d` |

## Akun Demo / Admin Setup

Jalankan seed (sudah membuat akun demo lengkap untuk **semua role**, bukan cuma Admin):

```bash
npm run db:seed
```

| Role | Username | Password | Catatan |
|---|---|---|---|
| Admin | `admin` | `admin123` | Dibuat khusus lewat seed, tidak ada form registrasi publik untuk Admin |
| Seller | `seller1` | `seller123` | Sudah punya toko "Toko Demo Sejahtera" + 3 produk |
| Buyer | `buyer1` | `buyer123` | Saldo wallet Rp5.000.000, sudah punya 1 alamat default |
| Driver | `driver1` | `driver123` | Siap menerima job begitu ada order yang diproses Seller |
| Multi-role | `multirole1` | `multirole123` | Punya Buyer+Seller+Driver sekaligus — pakai ini untuk demo role-selection |

Seed juga membuat voucher `DISKON10` (10%, maks Rp20.000) dan promo "Promo Pengguna
Baru" (flat Rp15.000) supaya alur diskon langsung bisa didemokan tanpa setup manual.

Akun Buyer/Seller/Driver baru lainnya tetap bisa dibuat lewat halaman `/register` —
satu username bisa memilih lebih dari satu role sekaligus (centang lebih dari satu
checkbox).

## Yang Ditambahkan di Level 2

- **Store CRUD**: Seller bisa membuat/mengubah profil toko di `/dashboard/seller/store`.
  Nama toko divalidasi unik di backend (`POST /api/store`), bukan hanya di frontend.
- **Product CRUD untuk Seller**: `/dashboard/seller/products` — create, update, delete.
  Setiap update/delete mengecek ulang di server apakah produk benar milik Seller yang
  login (`getOwnedProduct()` di `src/app/api/seller/products/[id]/route.ts`), supaya
  Seller A tidak bisa mengedit/menghapus produk milik Seller B walau tahu ID produknya.
- **Katalog publik pakai data asli**: `/products` dan `/products/[id]` sekarang fetch
  dari database (`prisma.product.findMany`), bukan dummy data statis lagi. Dummy data
  cuma jadi fallback kalau belum ada Seller yang upload produk sama sekali.
- **Halaman publik toko**: `/stores/[id]` menampilkan profil toko + semua produk aktif
  milik toko tersebut, bisa diakses Guest tanpa login.

### Endpoint API Baru (Level 2)

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| POST | `/api/store` | Seller | Buat/update profil toko sendiri |
| GET | `/api/store` | Seller | Ambil profil toko sendiri (buat prefill form) |
| GET | `/api/stores/[id]` | Public | Profil toko + produk aktifnya |
| GET | `/api/products` | Public | List semua produk aktif |
| GET | `/api/products/[id]` | Public | Detail satu produk |
| GET | `/api/seller/products` | Seller | List produk milik toko sendiri |
| POST | `/api/seller/products` | Seller | Buat produk baru |
| PUT | `/api/seller/products/[id]` | Seller | Update produk (cek kepemilikan) |
| DELETE | `/api/seller/products/[id]` | Seller | Hapus produk (cek kepemilikan) |

## Yang Ditambahkan di Level 3

- **Wallet Buyer**: saldo + dummy top-up + riwayat transaksi (`/dashboard/buyer/wallet`).
- **Alamat Pengiriman**: CRUD alamat, bisa set alamat utama (`/dashboard/buyer/addresses`).
- **Cart dengan Single-Store Checkout**: nambah/update/hapus item. Begitu item pertama
  masuk, cart "terkunci" ke toko itu (`cart.storeId`). Nambah produk dari toko lain akan
  ditolak dengan status 409 dan pesan jelas, baik di API maupun ditampilkan di UI cart.
- **Checkout**: `/checkout` — pilih alamat & metode pengiriman (Instant/Next Day/Regular),
  preview subtotal + biaya kirim + PPN 12% + total sebelum konfirmasi.
- **Order tercipta otomatis** setelah checkout: status awal `SEDANG_DIKEMAS`, stok produk
  berkurang, saldo wallet terpotong, semua dalam **satu transaksi database atomik**
  (`prisma.$transaction`) — supaya tidak ada kondisi stok jadi negatif atau saldo terpotong
  tapi order gagal dibuat.
- **Riwayat & detail pesanan** untuk Buyer (`/dashboard/buyer/orders`) dan daftar pesanan
  masuk untuk Seller (`/dashboard/seller/orders`), dengan timeline status & riwayat
  timestamp yang sama persis (komponen `OrderDetailView` dipakai bersama).

### Aturan Perhitungan Checkout (didokumentasikan agar konsisten)

- **Biaya pengiriman** flat per metode (lihat `src/lib/orderPricing.ts`):
  Instant Rp20.000, Next Day Rp12.000, Regular Rp7.000.
- **Urutan perhitungan**: `taxBase = (subtotal - discount) + deliveryFee`, lalu
  `PPN = 12% x taxBase`, `total = taxBase + PPN`. Diskon (Voucher/Promo) dihitung
  **sebelum** PPN — aturan ini dipakai konsisten di preview checkout, pembuatan order,
  dan laporan nanti di Level 4.
- Buyer tidak bisa checkout kalau saldo wallet < total, dan stok tidak bisa berkurang
  sampai negatif (dicek ulang di dalam transaksi database, bukan hanya di awal request,
  untuk menghindari race condition dua checkout bersamaan).

### Endpoint API Baru (Level 3)

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| GET/POST | `/api/wallet` | Buyer | Lihat saldo+riwayat / dummy top-up |
| GET/POST | `/api/addresses` | Buyer | List / tambah alamat |
| PUT/DELETE | `/api/addresses/[id]` | Buyer | Update / hapus alamat (cek kepemilikan) |
| GET/POST/DELETE | `/api/cart` | Buyer | Lihat keranjang / tambah item / kosongkan |
| PUT/DELETE | `/api/cart/items/[id]` | Buyer | Update kuantitas / hapus item |
| POST | `/api/checkout` | Buyer | Proses checkout jadi Order |
| GET | `/api/orders` | Buyer | Riwayat pesanan sendiri |
| GET | `/api/orders/[id]` | Buyer/Seller/Driver pemilik | Detail satu pesanan |
| GET | `/api/seller/orders` | Seller | Pesanan masuk ke toko sendiri |

## Yang Ditambahkan di Level 4

- **Voucher & Promo**: Admin bisa generate keduanya di `/dashboard/admin/vouchers` dan
  `/dashboard/admin/promos` (UI sederhana di level ini; akan dipercantik di Level 6).
  Voucher pakai kode unik + limit pemakaian; Promo tidak pakai kode, tinggal dipilih
  Buyer dari daftar promo aktif saat checkout.
- **Voucher dan Promo BISA digabung** dalam satu transaksi (keputusan desain, lihat
  `calculateDiscountAmount` di `src/lib/orderPricing.ts`) — totalnya dijumlah lalu
  di-cap supaya tidak melebihi subtotal.
- **Urutan diskon vs PPN**: diskon dipotong dari subtotal **sebelum** PPN dihitung
  (`taxBase = (subtotal - discount) + deliveryFee`), konsisten dengan Level 3.
- **Validasi ulang di dalam transaksi checkout**: voucher/promo dicek lagi (expiry,
  kuota) di dalam `prisma.$transaction` yang sama dengan stok & saldo, supaya dua
  checkout bersamaan tidak bisa berebut sisa kuota voucher yang sama.
- **Seller memproses order**: tombol "Proses Pesanan" di detail order Seller
  memindahkan status `SEDANG_DIKEMAS` &rarr; `MENUNGGU_PENGIRIM`, tercatat di
  `OrderStatusHistory` dengan timestamp. Order baru bisa diambil Driver (Level 5)
  setelah status ini.
- **Laporan Buyer** (`/dashboard/buyer/reports`): total belanja, total hemat dari
  diskon, jumlah pesanan, pesanan selesai vs dikembalikan.
- **Laporan Seller** (`/dashboard/seller/reports`): total pendapatan dihitung sebagai
  `subtotal - discountAmount` (tidak termasuk ongkir & PPN — itu bukan pendapatan
  Seller), pesanan yang sudah dikembalikan otomatis dikeluarkan dari hitungan.

### Endpoint API Baru (Level 4)

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| GET/POST | `/api/admin/vouchers` | Admin | List / generate voucher |
| GET/POST | `/api/admin/promos` | Admin | List / generate promo |
| GET | `/api/discounts/promos` | Buyer | List promo aktif & belum kedaluwarsa |
| POST | `/api/discounts/validate-voucher` | Buyer | Cek validitas kode voucher (preview) |
| POST | `/api/seller/orders/[id]/process` | Seller | Proses order ke Menunggu Pengirim |
| GET | `/api/reports/buyer` | Buyer | Ringkasan pengeluaran |
| GET | `/api/reports/seller` | Seller | Ringkasan pendapatan |

`POST /api/checkout` sekarang menerima `voucherCode` dan/atau `promoId` opsional.

## Yang Ditambahkan di Level 5

- **Job board Driver** (`/dashboard/driver/jobs`): hanya menampilkan order yang sudah
  diproses Seller (status `MENUNGGU_PENGIRIM` / `Delivery.status = WAITING_DRIVER`)
  dan belum diambil Driver lain. Order yang masih `SEDANG_DIKEMAS` tidak akan pernah
  muncul di sini.
- **Ambil Job**: pakai `updateMany` dengan kondisi `driverId: null AND status: WAITING_DRIVER`
  di dalam transaksi DB. Kalau dua Driver klik "Ambil" hampir bersamaan, hanya satu yang
  berhasil — yang kedua dapat error 409 "sudah diambil Driver lain". Order otomatis
  pindah ke status `SEDANG_DIKIRIM`.
- **Selesaikan Job**: Driver konfirmasi pesanan sudah diantar &rarr; order pindah ke
  `PESANAN_SELESAI`, pendapatan Driver bertambah otomatis.
- **Dashboard Driver**: job aktif, jumlah job selesai, dan total pendapatan — semua data
  asli dari database, bukan placeholder lagi.
- **Tracking untuk Buyer & Seller**: nama Driver yang mengantar otomatis tampil di
  halaman detail order (`OrderDetailView`), jadi Buyer/Seller bisa tahu siapa yang
  membawa pesanan mereka begitu status jadi Sedang Dikirim.
- **DriverProfile otomatis dibuat** saat registrasi kalau user memilih role Driver.

### Aturan Pendapatan Driver

Pendapatan Driver = **80% dari biaya pengiriman (delivery fee) order tersebut**, dihitung
di `calculateDriverEarning()` (`src/lib/orderPricing.ts`) dan disimpan di `Delivery.earning`
saat Seller memproses order (supaya nilainya tetap konsisten meskipun delivery fee
berubah di masa depan).

### Endpoint API Baru (Level 5)

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| GET | `/api/driver/jobs` | Driver | List job tersedia (belum diambil) |
| GET | `/api/driver/jobs/[id]` | Driver | Detail satu job |
| POST | `/api/driver/jobs/[id]/take` | Driver | Ambil job (atomik, anti race-condition) |
| POST | `/api/driver/jobs/[id]/complete` | Driver | Konfirmasi job selesai, tambah pendapatan |
| GET | `/api/driver/history` | Driver | Job aktif, riwayat, total pendapatan |

`POST /api/seller/orders/[id]/process` sekarang juga membuat baris `Delivery` baru.

## Yang Ditambahkan di Level 6

- **Admin Monitoring Dashboard** (`/dashboard/admin/monitoring`): ringkasan total user
  per role, toko, produk, order per status, voucher/promo aktif, status delivery job,
  dan jumlah order overdue yang belum/sudah ditangani — cukup buat demo keseluruhan
  sistem ke evaluator dalam satu halaman.
- **Voucher & Promo detail page**: klik salah satu voucher/promo di list sekarang
  membuka halaman detail (`/dashboard/admin/vouchers/[id]`, `/dashboard/admin/promos/[id]`)
  yang menampilkan info lengkap + daftar order yang memakainya.
- **Simulasi Waktu & Overdue Handling** (`/dashboard/admin/overdue`):
  - Tombol **"Majukan 1 Hari"** memajukan jam sistem simulasi (disimpan di tabel
    `SystemClock`, terpisah dari jam asli komputer) — ini cara kita "mensimulasikan
    hari berikutnya" sesuai requirement soal, tanpa perlu nunggu waktu asli berjalan.
  - Tombol **"Jalankan Sekarang"** memicu job overdue: mengecek semua order yang
    belum `PESANAN_SELESAI`/`DIKEMBALIKAN`, membandingkan `Order.createdAt + SLA jam`
    terhadap jam sistem (simulasi). Yang sudah lewat SLA otomatis:
    1. Status order &rarr; `DIKEMBALIKAN`
    2. Saldo Buyer di-refund sebesar `order.total`, tercatat di riwayat wallet
       (tipe `REFUND`)
    3. Stok semua item di order itu dikembalikan ke produk terkait
    4. Pendapatan Seller untuk order itu otomatis tidak lagi terhitung di laporan
       (laporan Seller sejak Level 4 sudah mengecualikan order berstatus `DIKEMBALIKAN`)
  - **Anti double-processing**: setiap order overdue diproses di transaksi DB
    tersendiri yang mengecek ulang flag `refunded` dan status order *di dalam*
    transaksi — jadi tombol "Jalankan Sekarang" aman diklik berkali-kali, order yang
    sudah diproses tidak akan kena refund/restock dua kali.

### Aturan SLA Pengiriman (untuk Overdue)

SLA dihitung dari `Order.createdAt` (bukan dari status terakhir, supaya sederhana dan
konsisten — didokumentasikan di sini). Lihat `DELIVERY_SLA_HOURS` di
`src/lib/orderPricing.ts`:

| Metode Pengiriman | SLA |
|---|---|
| Instant | 3 jam |
| Next Day | 24 jam |
| Regular | 72 jam |

Order yang masih berstatus `SEDANG_DIKEMAS`, `MENUNGGU_PENGIRIM`, atau `SEDANG_DIKIRIM`
saat waktu sistem sudah melewati `createdAt + SLA` akan otomatis dikembalikan/refund.

### Endpoint API Baru (Level 6)

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| GET | `/api/admin/monitoring` | Admin | Statistik agregat seluruh marketplace |
| GET | `/api/admin/system-clock` | Admin | Lihat waktu sistem (simulasi) saat ini |
| POST | `/api/admin/system-clock/advance-day` | Admin | Majukan jam sistem 1 hari |
| POST | `/api/admin/overdue/run` | Admin | Jalankan pengecekan & auto-refund overdue |
| GET | `/api/admin/vouchers/[id]` | Admin | Detail voucher + order yang memakainya |
| GET | `/api/admin/promos/[id]` | Admin | Detail promo + order yang memakainya |

## Yang Ditambahkan di Level 7

- **Sanitasi diperluas**: sebelumnya hanya komentar review yang disanitasi
  (`sanitizePlainText`). Sekarang nama/deskripsi toko, nama/deskripsi produk, dan
  field alamat (label, nama penerima, alamat lengkap, kota) juga disanitasi sebelum
  disimpan — defense-in-depth di atas auto-escaping React yang sudah berjalan sejak
  awal (kode ini **tidak pernah** memakai `dangerouslySetInnerHTML` di mana pun).
- **Validasi lebih ketat**: nomor telepon di form alamat sekarang divalidasi format
  (regex), bukan cuma panjang karakter.
- **Security headers**: `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy` ditambahkan secara global lewat `next.config.ts`.
- **Akun demo lengkap untuk semua role** (lihat tabel di bawah) lewat `npm run db:seed`
  yang diperluas — sebelumnya cuma bikin Admin.
- **Dokumentasi final** di folder `docs/`:
  - `API_DOCUMENTATION.md` — ringkasan seluruh endpoint per kategori
  - `seapedia.postman_collection.json` — koleksi Postman siap-import, semua endpoint
  - `SECURITY.md` — penjelasan lengkap SQL Injection, XSS, validasi input, sesi, RBAC
  - `TESTING_GUIDE.md` — panduan demo end-to-end langkah demi langkah dari Guest
    sampai Admin overdue handling

Detail lengkap soal SQL Injection, XSS, validasi input, perilaku sesi, dan RBAC ada
di `docs/SECURITY.md` — ringkasannya: semua query lewat Prisma ORM (parameterized,
anti SQLi), semua input lewat skema zod, semua konten user disanitasi +
auto-escaped React (anti XSS), sesi pakai JWT httpOnly cookie 7 hari, dan **role aktif
selalu divalidasi ulang di server** terhadap database, baik di setiap API route
(`requireRole()`) maupun di setiap halaman dashboard (`redirect()` di Server
Component) — tidak pernah dipercaya begitu saja dari frontend.

## Konsep Multi-Role & Active Role









- Satu akun non-admin bisa punya kombinasi role: Buyer, Seller, Driver (sekaligus).
- Admin diperlakukan sebagai akun terpisah/single-role (dibuat lewat seed, bukan
  form publik), untuk menyederhanakan pemisahan privilese.
- Setelah login, jika user punya >1 role, user **wajib** memilih "role aktif" di
  halaman `/select-role` sebelum bisa masuk ke dashboard manapun.
- Role aktif disimpan di cookie httpOnly terpisah dari token sesi, tapi **selalu
  divalidasi ulang di server** (`getActiveRole()` di `src/lib/auth.ts`) terhadap daftar
  role yang benar-benar dimiliki user di database. Jadi cookie tidak bisa dipakai
  untuk mengklaim role yang tidak dimiliki.
- Semua endpoint privat & halaman dashboard memverifikasi role aktif di server side
  (lihat `requireRole()` di `src/lib/auth.ts` dan guard di setiap `dashboard/*/page.tsx`),
  bukan hanya menyembunyikan UI di frontend.

## Single-Store Checkout Rule (sudah diimplementasikan penuh sejak Level 3)

Field `Cart.storeId` dimulai `null`. Begitu item pertama ditambahkan lewat
`POST /api/cart`, `storeId` cart dikunci ke toko produk tersebut (`src/lib/cart.ts`).
Penambahan produk dari toko lain akan ditolak dengan response `409` dan kode
`SINGLE_STORE_CONFLICT`, dan UI keranjang/produk menampilkan pesan yang meminta Buyer
mengosongkan keranjang dulu (lihat `src/components/layout/AddToCartButton.tsx` dan
`src/app/cart/page.tsx`).

## Keamanan (Ringkasan — Detail Lengkap di `docs/SECURITY.md`)

- Password di-hash dengan bcrypt, tidak pernah disimpan plain text.
- Session pakai JWT yang disimpan di cookie httpOnly (tidak bisa diakses JavaScript
  di client), sehingga lebih tahan terhadap XSS token theft.
- Semua konten user-generated (review, nama/deskripsi toko & produk, alamat)
  disanitasi lewat `sanitizePlainText()` sebelum disimpan, dan dirender sebagai text
  node oleh React (otomatis ter-escape, tidak pernah pakai `dangerouslySetInnerHTML`).
- Prisma ORM dipakai untuk semua query database — parameterized otomatis, sehingga
  terhindar dari SQL Injection klasik.
- Validasi input pakai zod di setiap endpoint yang menerima body.
- Role aktif divalidasi ulang di server pada setiap request (API maupun halaman
  dashboard), tidak pernah dipercaya begitu saja dari cookie/frontend.
- Lihat [`docs/SECURITY.md`](./docs/SECURITY.md) untuk pembahasan lengkap per poin
  beserta cara mengujinya sendiri.

## Struktur Folder Penting

```
src/
  app/
    page.tsx                  -> landing page (hero, produk pilihan, review publik)
    products/, stores/[id]/   -> katalog & toko publik
    login/, register/, select-role/  -> auth & role selection
    cart/, checkout/          -> alur belanja Buyer
    dashboard/{admin,seller,buyer,driver}/ -> dashboard & sub-halaman per role
    api/                      -> seluruh REST API, lihat docs/API_DOCUMENTATION.md
  components/
    ui/        -> Button, Input, Card (reusable)
    layout/    -> Navbar, Footer, AppReviewSection, OrderDetailView, AddToCartButton
  lib/
    prisma.ts        -> Prisma client singleton (pakai adapter-pg)
    auth.ts          -> hashing, JWT, getCurrentUser, getActiveRole, requireRole
    sanitize.ts      -> sanitasi input user-generated content
    cart.ts          -> helper single-store cart
    orderPricing.ts  -> aturan delivery fee, PPN, diskon, driver earning, SLA
    systemClock.ts   -> simulasi waktu untuk overdue handling
prisma/
  schema.prisma -> skema lengkap Level 1-7
  seed.ts        -> seed akun demo semua role + voucher/promo contoh
docs/
  API_DOCUMENTATION.md           -> ringkasan seluruh endpoint
  seapedia.postman_collection.json -> koleksi Postman siap-import
  SECURITY.md                    -> catatan keamanan lengkap
  TESTING_GUIDE.md                -> panduan demo end-to-end
```

## Catatan Penting

- Skema Prisma (`prisma/schema.prisma`) didesain mencakup seluruh kebutuhan
  Level 1-7 sejak awal, sehingga tidak perlu migrasi besar di tengah jalan.
- Field `roles: string[]` dikembalikan dari endpoint `/api/auth/me` dan dipakai
  Navbar untuk menampilkan dashboard yang sesuai dan status "perlu pilih role".

## Status: Semua Level Selesai

| Level | Fitur Utama | Status |
|---|---|---|
| 1 | Public marketplace, auth, multi-role, review publik | ✅ |
| 2 | Seller store & product CRUD | ✅ |
| 3 | Wallet, address, cart (single-store), checkout + PPN 12% | ✅ |
| 4 | Voucher/Promo, Seller proses order, laporan Buyer/Seller | ✅ |
| 5 | Driver job board, take/complete job, earnings | ✅ |
| 6 | Admin monitoring, overdue auto refund/return, simulasi waktu | ✅ |
| 7 | Sanitasi & validasi diperluas, security headers, dokumentasi final | ✅ |

