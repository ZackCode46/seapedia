import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { advanceSystemClock } from "@/lib/systemClock";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Admin: manually simulate the next day passing, for demo purposes.
// This advances the system-wide time offset used by getSystemNow(), which
// the overdue-check job uses to decide whether an order's SLA has passed.
export async function POST() {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const newSimulatedNow = await advanceSystemClock(ONE_DAY_MS);
  return NextResponse.json({ message: "Waktu sistem dimajukan 1 hari", simulatedNow: newSimulatedNow });
}
