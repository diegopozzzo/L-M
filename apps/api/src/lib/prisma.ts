import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../config/env.js";
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString = env.DATABASE_URL;

const globalForPrisma = globalThis as {
  prisma?: PrismaClient;
};

type PrismaPgConfig = ConstructorParameters<typeof PrismaPg>[0];

const poolConfig: PrismaPgConfig = {
  connectionString,
};

if (env.DATABASE_SSL) {
  poolConfig.ssl = {
    rejectUnauthorized: env.DATABASE_SSL_REJECT_UNAUTHORIZED,
  };
}

const adapter = new PrismaPg(poolConfig);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
