import { NextResponse } from "next/server";
import { getCurrentUser, getActiveRole } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  const activeRole = await getActiveRole();

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      roles: user.roles.map((r) => r.role),
      activeRole,
      needsRoleSelection: user.roles.length > 1 && !activeRole,
      storeName: user.store?.name ?? null,
      walletBalance: undefined, // populated in Level 3 dashboard endpoint, kept null here intentionally
    },
  });
}
