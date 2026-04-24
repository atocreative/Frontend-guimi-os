import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  __prismaAdapter: PrismaPg | undefined
  __pgPool: Pool | undefined
}

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || ""

function getAdapter() {
  if (!globalForPrisma.__prismaAdapter) {
    globalForPrisma.__pgPool = new Pool({ connectionString })
    globalForPrisma.__prismaAdapter = new PrismaPg(globalForPrisma.__pgPool)
  }
  return globalForPrisma.__prismaAdapter
}

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter: getAdapter() })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
