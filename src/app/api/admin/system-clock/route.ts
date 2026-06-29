import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getSystemNow, getClockOffsetMs } from "@/lib/systemClock";

export async function GET() {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const now = await getSystemNow();
  const offsetMs = await getClockOffsetMs();
  return NextResponse.json({ simulatedNow: now, offsetMs, realNow: new Date() });
}
