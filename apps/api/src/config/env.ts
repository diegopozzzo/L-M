import { existsSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";

const envFiles = [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../../.env"),
];

for (const envFile of envFiles) {
  if (existsSync(envFile)) {
    dotenv.config({ path: envFile, override: false });
  }
}

function parseEnvList(value: string | undefined, fallback: string[] = []) {
  const items = value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!items || items.length === 0) {
    return fallback;
  }

  return items;
}

const appOrigins = parseEnvList(process.env.APP_ORIGINS ?? process.env.APP_ORIGIN, [
  "http://localhost:3000",
]);

export const env = {
  APP_NAME: process.env.APP_NAME ?? "legal-api",
  NODE_ENV: process.env.NODE_ENV ?? "development",
  HOST: process.env.HOST ?? "0.0.0.0",
  PORT: Number(process.env.PORT ?? 4000),
  APP_ORIGIN: appOrigins[0] ?? "http://localhost:3000",
  APP_ORIGINS: appOrigins,
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  JWT_SECRET: process.env.JWT_SECRET ?? "",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? "",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "15m",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  BCRYPT_SALT_ROUNDS: Number(process.env.BCRYPT_SALT_ROUNDS ?? 10),
  DATABASE_SSL:
    (process.env.DATABASE_SSL ??
      (process.env.NODE_ENV === "production" ? "true" : "false"))
      .trim()
      .toLowerCase() === "true",
  DATABASE_SSL_REJECT_UNAUTHORIZED:
    (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED ?? "false")
      .trim()
      .toLowerCase() === "true",
  AWS_REGION: process.env.AWS_REGION ?? "",
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET ?? "",
};
