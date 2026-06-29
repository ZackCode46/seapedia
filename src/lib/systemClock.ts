import { prisma } from "./prisma";

/**
 * Returns the "current time" as far as overdue/SLA logic is concerned.
 * This is real wall-clock time plus an admin-controlled offset, so the whole
 * system can simulate "the next day" for demo purposes without waiting for
 * actual time to pass (per the challenge requirement to provide a way to
 * simulate next-day / move system time forward).
 */
export async function getSystemNow(): Promise<Date> {
  const clock = await prisma.systemClock.findUnique({ where: { id: "singleton" } });
  const offsetMs = clock ? Number(clock.offsetMs) : 0;
  return new Date(Date.now() + offsetMs);
}

export async function advanceSystemClock(byMs: number): Promise<Date> {
  const clock = await prisma.systemClock.upsert({
    where: { id: "singleton" },
    update: { offsetMs: { increment: BigInt(byMs) } },
    create: { id: "singleton", offsetMs: BigInt(byMs) },
  });
  return new Date(Date.now() + Number(clock.offsetMs));
}

export async function getClockOffsetMs(): Promise<number> {
  const clock = await prisma.systemClock.findUnique({ where: { id: "singleton" } });
  return clock ? Number(clock.offsetMs) : 0;
}
