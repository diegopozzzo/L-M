import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { apiRequestWithSession } from "@/lib/auth-server";

async function relayApiResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | Record<string, unknown>
    | null;

  return NextResponse.json(payload ?? { ok: response.ok }, {
    status: response.status,
  });
}

function unauthorizedResponse() {
  return NextResponse.json(
    {
      ok: false,
      mensaje: "Tu sesion no esta disponible o ya expiro.",
      codigo: "SESSION_UNAVAILABLE",
    },
    { status: 401 },
  );
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const search = request.nextUrl.searchParams.toString();
  const path = search ? `/expedientes?${search}` : "/expedientes";
  const response = await apiRequestWithSession(cookieStore, path, {
    method: "GET",
  });

  if (!response) {
    return unauthorizedResponse();
  }

  return relayApiResponse(response);
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const body = await request.text();
  const response = await apiRequestWithSession(cookieStore, "/expedientes", {
    method: "POST",
    body,
  });

  if (!response) {
    return unauthorizedResponse();
  }

  return relayApiResponse(response);
}
