import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { RoleName } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export const SESSION_COOKIE = "seapedia_token";
export const ACTIVE_ROLE_COOKIE = "seapedia_active_role";

// ---------- Password hashing ----------
export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

// ---------- JWT ----------
export type JwtPayload = { userId: string };

export function signToken(payload: JwtPayload) {
  const options: jwt.SignOptions = { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// ---------- Current user / active role (server-side, source of truth) ----------
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { roles: true, store: true, driverProfile: true },
  });
  return user;
}

/**
 * Returns the active role for the current session.
 * IMPORTANT: this re-validates against the DB-owned role list every time,
 * so the frontend cookie can never grant a role the user doesn't actually own.
 */
export async function getActiveRole(): Promise<RoleName | null> {
  const cookieStore = await cookies();
  const cookieRole = cookieStore.get(ACTIVE_ROLE_COOKIE)?.value as RoleName | undefined;
  if (!cookieRole) return null;

  const user = await getCurrentUser();
  if (!user) return null;

  const owned = user.roles.some((r) => r.role === cookieRole);
  return owned ? cookieRole : null;
}

/**
 * Use this inside API routes to enforce role-based access control.
 * Throws a Response-friendly error object if unauthorized.
 */
export async function requireRole(allowed: RoleName[]) {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false as const, status: 401, message: "Not authenticated" };
  }
  const activeRole = await getActiveRole();
  if (!activeRole || !allowed.includes(activeRole)) {
    return { ok: false as const, status: 403, message: "Active role not authorized for this action" };
  }
  return { ok: true as const, user, activeRole };
}
