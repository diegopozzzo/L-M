import type { Request } from "express";

export type RequestMetadata = {
  ip: string | null;
  userAgent: string | null;
};

export function getRequestMetadata(req: Request): RequestMetadata {
  const forwarded = req.headers["x-forwarded-for"];
  const firstForwardedIp =
    typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : undefined;

  return {
    ip: firstForwardedIp ?? req.ip ?? null,
    userAgent: req.get("user-agent")?.slice(0, 255) ?? null,
  };
}
