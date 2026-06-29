# SEAPEDIA API Documentation

Base URL (local dev): `http://localhost:3000`

Authentication uses an **httpOnly cookie** (`seapedia_token`, a JWT) set by
`POST /api/auth/login`. There is no `Authorization` header — the browser/Postman
sends the cookie automatically on every subsequent request to the same origin.
A second cookie, `seapedia_active_role`, tracks which role is active for accounts
with multiple roles; it is always re-validated server-side against the user's real
roles in the database (see `src/lib/auth.ts: getActiveRole()`).

A ready-to-import Postman collection covering every endpoint below is provided at
[`docs/seapedia.postman_collection.json`](./seapedia.postman_collection.json).

## Auth

| Method | Path | Access | Body | Notes |
|---|---|---|---|---|
| POST | `/api/auth/register` | Public | `username, email, password, name, phone?, roles[]` | `roles` ⊂ `BUYER, SELLER, DRIVER` |
| POST | `/api/auth/login` | Public | `identifier, password` | `identifier` = username or email |
| POST | `/api/auth/logout` | Any | — | Clears both cookies |
| GET | `/api/auth/me` | Any | — | Current profile + active role |
| POST | `/api/auth/select-role` | Logged in | `role` | Must be a role the user actually owns |

## Public

| Method | Path | Access |
|---|---|---|
| GET | `/api/products` | Public |
| GET | `/api/products/[id]` | Public |
| GET | `/api/stores/[id]` | Public |
| GET | `/api/reviews` | Public |
| POST | `/api/reviews` | Public (guest allowed) |

## Seller

| Method | Path | Body |
|---|---|---|
| GET/POST | `/api/store` | `name, description?, logoUrl?` |
| GET/POST | `/api/seller/products` | `name, description?, price, stock, imageUrl?` |
| PUT/DELETE | `/api/seller/products/[id]` | partial update |
| GET | `/api/seller/orders` | — |
| POST | `/api/seller/orders/[id]/process` | — |
| GET | `/api/reports/seller` | — |

## Buyer

| Method | Path | Body |
|---|---|---|
| GET/POST | `/api/wallet` | `amount` (top-up) |
| GET/POST | `/api/addresses` | address fields |
| PUT/DELETE | `/api/addresses/[id]` | partial update |
| GET/POST/DELETE | `/api/cart` | `productId, quantity` (POST) |
| PUT/DELETE | `/api/cart/items/[id]` | `quantity` (PUT) |
| POST | `/api/discounts/validate-voucher` | `code, subtotal` |
| GET | `/api/discounts/promos` | — |
| POST | `/api/checkout` | `addressId, deliveryMethod, voucherCode?, promoId?` |
| GET | `/api/orders` | — |
| GET | `/api/orders/[id]` | accessible to the owning Buyer/Seller/Driver |
| GET | `/api/reports/buyer` | — |

## Driver

| Method | Path |
|---|---|
| GET | `/api/driver/jobs` |
| GET | `/api/driver/jobs/[id]` |
| POST | `/api/driver/jobs/[id]/take` |
| POST | `/api/driver/jobs/[id]/complete` |
| GET | `/api/driver/history` |

## Admin

| Method | Path | Body |
|---|---|---|
| GET/POST | `/api/admin/vouchers` | `code, discountType, discountValue, maxDiscount?, expiresAt, usageLimit` |
| GET | `/api/admin/vouchers/[id]` | — |
| GET/POST | `/api/admin/promos` | `name, discountType, discountValue, maxDiscount?, expiresAt, isActive?` |
| GET | `/api/admin/promos/[id]` | — |
| GET | `/api/admin/monitoring` | — |
| GET | `/api/admin/system-clock` | — |
| POST | `/api/admin/system-clock/advance-day` | — |
| POST | `/api/admin/overdue/run` | — |

## Standard Error Shape

```json
{ "error": "Human-readable message in Indonesian", "details": { /* optional zod error tree */ } }
```

HTTP status codes used: `400` (validation), `401` (not authenticated), `403` (active
role not authorized / not resource owner), `404` (not found), `409` (conflict, e.g.
single-store cart conflict or job already taken), `500` (unexpected server error).
