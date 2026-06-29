# SEAPEDIA Security Notes

This document consolidates how SEAPEDIA addresses the Level 7 security requirements.

## SQL Injection

All database access goes through **Prisma ORM** (`@prisma/client` + `@prisma/adapter-pg`).
Every query in `src/app/api/**` and `src/lib/**` uses Prisma's query builder
(`findUnique`, `findMany`, `create`, `update`, `$transaction`, etc.) — none of the code
constructs raw SQL strings by concatenating user input. Prisma parameterizes all
generated queries automatically, which is what prevents classic SQL injection
(e.g. `' OR '1'='1`, `'; DROP TABLE users; --`) from having any effect: the input is
always bound as a parameter value, never interpreted as SQL syntax.

**Test it yourself:** try logging in with `identifier = admin' OR '1'='1` and any
password — it will simply fail to match any user, because Prisma treats the whole
string as a literal value to compare, not as part of the query.

## XSS (Cross-Site Scripting)

Two layers:

1. **React's default escaping.** Every place SEAPEDIA renders user-generated text —
   review comments, product/store names & descriptions, address fields, names — uses
   plain JSX expressions like `{comment}`. React escapes these by default. The
   codebase **never uses `dangerouslySetInnerHTML`** anywhere, so there is no code
   path that could execute injected HTML/script tags even if one slipped through.
2. **Server-side sanitization on write**, as defense-in-depth on top of (1):
   `sanitizePlainText()` (`src/lib/sanitize.ts`, backed by `isomorphic-dompurify`)
   strips all HTML tags from app review comments/names, store name/description,
   product name/description, and address free-text fields **before** they're stored —
   so even a future change to use `dangerouslySetInnerHTML` somewhere wouldn't
   suddenly become exploitable from old data.

**Test it yourself:** submit an app review with comment
`<script>alert('xss')</script>` — it will be displayed as the literal text
`<script>alert('xss')</script>` (or stripped entirely), never executed.

## Input Validation

Every API route that accepts a body validates it with a **zod schema** before doing
anything else (see any `src/app/api/**/route.ts` — they all start with
`schema.safeParse(...)`). This covers: email format, password length, phone format
(regex), rating range (1–5), price/stock (positive integers), discount values, dates,
and required fields. Invalid input gets a `400` response with a clear error message
and never reaches the database layer.

## Session Behavior

- Session token is a **JWT signed with `JWT_SECRET`**, stored in an **httpOnly
  cookie** (`seapedia_token`) — not accessible to JavaScript, which limits the blast
  radius of any XSS that might otherwise try to steal it.
- Default expiry: **7 days** (`JWT_EXPIRES_IN` env var, configurable).
- `POST /api/auth/logout` deletes both the session cookie and the active-role cookie,
  invalidating the session client-side. Since the JWT itself isn't stored
  server-side, the token will still cryptographically verify until it expires if
  somehow replayed — for a project at this scope we rely on the cookie deletion +
  short expiry rather than a server-side revocation list. This is a known and
  documented trade-off.
- The **active role cookie is never trusted on its own** — `getActiveRole()`
  re-checks it against the user's real `UserRole` rows in the database on every
  request. Editing the cookie value in DevTools to claim an unowned role does
  nothing; the server falls back to "no active role".

## Role-Based Access Control (RBAC)

- Every protected **API route** calls `requireRole([...])` (`src/lib/auth.ts`) first,
  which independently re-derives the active role server-side — it never trusts a
  role sent in the request body or headers.
- Every protected **dashboard page** (`src/app/dashboard/**/page.tsx`) is a Server
  Component that calls `getCurrentUser()` / `getActiveRole()` and `redirect()`s away
  if the check fails — so manually typing a dashboard URL in the browser cannot
  bypass it; the page itself refuses to render without doing the DB-backed check.
- **Resource ownership** is checked on every mutation: a Seller can only update/delete
  their own products (`getOwnedProduct()`), process orders for their own store, a
  Buyer can only modify their own addresses/cart/orders, a Driver can only complete a
  job assigned to them (`job.driverId !== driverProfile.id` check), etc. These checks
  compare the resource's owner ID against the authenticated user's ID — never against
  anything supplied by the client.
- Admin-only endpoints/pages use `requireRole(["ADMIN"])` / role check identically to
  other roles — there's no separate, weaker code path for Admin.

## Summary Table

| Requirement | Where |
|---|---|
| SQL Injection prevention | Prisma ORM everywhere, no raw SQL |
| XSS prevention | React auto-escaping + DOMPurify sanitization on write |
| Input validation | zod schemas on every API route |
| Session handling | httpOnly JWT cookie, 7-day expiry, logout clears cookies |
| RBAC | `requireRole()` on APIs, server-component redirects on pages, ownership checks |
