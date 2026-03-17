import bcrypt from "bcrypt";
import { env } from "../config/env.js";

export async function hashPassword(value: string) {
  return bcrypt.hash(value, env.BCRYPT_SALT_ROUNDS);
}

export async function comparePassword(value: string, passwordHash: string) {
  return bcrypt.compare(value, passwordHash);
}
