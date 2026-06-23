<<<<<<< HEAD
# SEAPEDIA

Marketplace multi-role (Admin, Seller, Buyer, Driver) — dikerjakan bertahap sesuai
level di soal Technical Challenge SEAPEDIA.

**Status progres saat ini: Level 1 selesai** (Public Marketplace, Auth & Role Awareness,
Public Application Reviews, Reusable UI). Level 2-7 akan ditambahkan secara bertahap.

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

Akun **Admin tidak dibuat lewat form registrasi publik** (form registrasi hanya
untuk role Buyer/Seller/Driver). Admin dibuat lewat seed script:

```bash
npm run db:seed
```

Ini akan membuat akun:
- username: `admin`
- password: `admin123`

Akun Buyer/Seller/Driver dibuat lewat halaman `/register` — satu username bisa
memilih lebih dari satu role sekaligus (centang lebih dari satu checkbox).

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

## Single-Store Checkout Rule (dipersiapkan dari awal, diimplementasi penuh di Level 3)

Skema `Cart` punya field `storeId` yang awalnya `null`. Begitu item pertama
ditambahkan, `storeId` cart dikunci ke toko produk tersebut. Penambahan produk dari
toko lain akan ditolak/diminta mengosongkan keranjang dulu. Aturan ini akan
diimplementasikan penuh di endpoint cart pada Level 3.

## Keamanan yang Sudah Disiapkan dari Level 1

- Password di-hash dengan bcrypt, tidak pernah disimpan plain text.
- Session pakai JWT yang disimpan di cookie httpOnly (tidak bisa diakses JavaScript
  di client), sehingga lebih tahan terhadap XSS token theft.
- Komentar review publik disanitasi (strip semua tag HTML) sebelum disimpan ke
  database lewat `sanitizePlainText()`, dan dirender sebagai text node oleh React
  (otomatis ter-escape). Hardening XSS/SQLi yang lebih formal dan menyeluruh akan
  didokumentasikan lebih detail di Level 7.
- Prisma ORM dipakai untuk semua query database — parameterized otomatis, sehingga
  terhindar dari SQL Injection klasik.

## Struktur Folder Penting

```
src/
  app/
    page.tsx                  -> landing page (hero, produk pilihan, review publik)
    products/                 -> katalog publik (list + detail, dummy data di Level 1)
    login/, register/         -> auth pages
    select-role/              -> pemilihan role aktif untuk akun multi-role
    dashboard/{admin,seller,buyer,driver}/ -> dashboard shell per role
    api/
      auth/{register,login,logout,me,select-role}/route.ts
      reviews/route.ts         -> public app review (GET list, POST create)
  components/
    ui/        -> Button, Input, Card (reusable)
    layout/    -> Navbar, Footer, AppReviewSection
  lib/
    prisma.ts  -> Prisma client singleton
    auth.ts    -> hashing, JWT, getCurrentUser, getActiveRole, requireRole
    sanitize.ts-> sanitasi input user-generated content
    dummyData.ts -> data produk dummy (Level 1, diganti data asli di Level 2)
prisma/
  schema.prisma -> skema lengkap untuk Level 1-7 (sudah didesain di awal)
  seed.ts        -> seed akun Admin
```

## Catatan Penting

- Skema Prisma (`prisma/schema.prisma`) sudah didesain mencakup seluruh kebutuhan
  Level 1-7 (Store, Product, Wallet, Cart, Order, Voucher, Promo, Delivery, dll) agar
  tidak perlu migrasi besar di tengah jalan. Model yang belum dipakai di level ini
  (misalnya `Order`, `Delivery`) baru akan diisi/dipakai mulai Level 3 dan Level 5.
- Field `roles: string[]` dikembalikan dari endpoint `/api/auth/me` dan dipakai
  Navbar untuk menampilkan dashboard yang sesuai dan status "perlu pilih role".

## Level Selanjutnya

- **Level 2**: Seller store & product CRUD, katalog publik pakai data asli.
- **Level 3**: Wallet, address, cart, checkout dengan PPN 12%.
- **Level 4**: Voucher/Promo, Seller memproses order, laporan Buyer/Seller.
- **Level 5**: Driver job board, take job, complete job, earnings.
- **Level 6**: Admin monitoring dashboard, overdue auto refund/return, simulasi waktu.
- **Level 7**: Hardening keamanan penuh (SQLi/XSS test case, RBAC backend, dokumentasi final).
=======
# seapedia
Soal Seleksi
>>>>>>> df896ded6bef597c29084eff4f4f3b3eaa43f4ae
