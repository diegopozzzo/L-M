import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/auth-server";

export async function POST(request: Request) {
  const body = await request.text();
  const response = await fetch(`${getApiBaseUrl()}/contacto`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({ ok: response.ok }));

  return NextResponse.json(payload, {
    status: response.status,
  });
}

