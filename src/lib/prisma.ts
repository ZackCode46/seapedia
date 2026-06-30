import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function buildClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 20000,
    idleTimeoutMillis: 60000,
    max: 10,
  });
  pool.on("error", (err) => {
    // Prevents an idle-client connection error from crashing the whole process;
    // Prisma will simply open a new connection on the next query.
    console.error("Unexpected PG pool error (non-fatal):", err.message);
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? buildClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
