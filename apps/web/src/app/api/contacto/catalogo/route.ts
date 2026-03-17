import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/auth-server";

export async function GET() {
  const response = await fetch(`${getApiBaseUrl()}/contacto/catalogo`, {
    method: "GET",
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({ ok: response.ok }));

  return NextResponse.json(payload, {
    status: response.status,
  });
}

