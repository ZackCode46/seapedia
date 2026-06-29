# SEAPEDIA — End-to-End Testing Guide

Run `npm run db:seed` first so all demo accounts below already exist (see README for
the full account list and passwords).

## 1. Guest, Review & Auth Flow

1. Open `/` without logging in. Confirm you can browse `/products` and a product
   detail page, but there's no checkout action available.
2. Scroll to the review section, submit a review **without logging in**. It should
   appear in the list immediately.
3. Try submitting a review with `<script>alert(1)</script>` as the comment — confirm
   it renders as plain text, not an executed script.
4. Register a new account and tick **more than one role** (e.g. Buyer + Seller).
5. Log in with that account → you should land on `/select-role`, not a dashboard.
6. Pick a role → confirm you land on the matching dashboard and the navbar shows
   that role.
7. Manually edit the URL to a different role's dashboard (e.g. type
   `/dashboard/seller` while active role is Buyer) → confirm you're redirected to
   `/select-role`, proving the check is server-side.

## 2. Seller Flow

1. Log in as `seller1` / `seller123` (already has a store + 3 products from seed).
2. Try creating a store with the name `Toko Demo Sejahtera` (already taken) on a
   second seller account → confirm it's rejected.
3. Add a new product, edit its price/stock, delete it.
4. Confirm the new/edited products show up on the public `/products` page.

## 3. Buyer Flow

1. Log in as `buyer1` / `buyer123` (already has Rp5.000.000 wallet balance and a
   default address from seed).
2. Add a product from `Toko Demo Sejahtera` to cart.
3. Try adding a product from a **different** store → confirm the single-store
   conflict message appears and the item is rejected.
4. Go to `/checkout`, apply voucher code `DISKON10`, pick a delivery method, confirm
   the summary shows subtotal, discount, delivery fee, PPN 12%, and total correctly.
5. Confirm checkout — wallet balance should decrease by the total, product stock
   should decrease by the quantity bought.
6. Check `/dashboard/buyer/orders` — the new order should show status
   **Sedang Dikemas**.

## 4. Seller Processes the Order

1. Log in as `seller1` again → `/dashboard/seller/orders` → open the order from step
   3 → click **Proses Pesanan**.
2. Status should move to **Menunggu Pengirim**, with a timestamped entry in the
   status history.

## 5. Driver Flow

1. Log in as `driver1` / `driver123`.
2. `/dashboard/driver/jobs` → the order from step 4 should now be visible. Orders
   still "Sedang Dikemas" must **not** appear here.
3. Take the job → order status becomes **Sedang Dikirim**.
4. (Optional) Open the same job in a second browser/incognito session as another
   Driver account → confirm taking it again returns a 409 "already taken" error.
5. Confirm the job as completed → order becomes **Pesanan Selesai**, and the
   Driver's total earning increases.
6. Log back in as `buyer1`/`seller1` and check the order detail — the Driver's name
   should now be visible in the tracking info.

## 6. Admin, Overdue & Monitoring

1. Log in as `admin` / `admin123`.
2. `/dashboard/admin/monitoring` — confirm counts reflect what you've done so far
   (users, orders by status, etc).
3. `/dashboard/admin/vouchers` and `/promos` — create a new voucher/promo, open its
   detail page.
4. Place another Buyer order (any delivery method), but **don't** have a Driver
   complete it.
5. Go to `/dashboard/admin/overdue` → click **"Majukan 1 Hari"** repeatedly until
   you've passed that delivery method's SLA (Instant 3h / Next Day 24h / Regular 72h
   — so for Regular, click it 4 times to pass 72 hours).
6. Click **"Jalankan Sekarang"** → the order should appear in the results with its
   refund amount.
7. Confirm: Buyer's wallet balance increased by the refund, the product's stock
   increased back, the order status is now **Dikembalikan**, and the Seller's income
   report no longer counts that order.
8. Click "Jalankan Sekarang" again → confirm the same order does **not** get
   refunded a second time.

## 7. Security Spot-Checks

1. Try logging in with `identifier = ' OR '1'='1` and any password → should fail
   normally (no SQL injection effect, see `docs/SECURITY.md`).
2. While logged in as a Buyer, try calling a Seller-only or Admin-only endpoint
   directly (e.g. via Postman, with your Buyer session cookie) → should get `403`.
3. Try editing another user's address/order/product ID into a request you send as
   yourself → should get `404`/`403`, never someone else's data.
4. Log out, then try reusing the old session in a request → cookie is gone, so the
   request is treated as unauthenticated.
