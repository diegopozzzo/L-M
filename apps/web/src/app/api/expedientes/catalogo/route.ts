import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { apiRequestWithSession } from "@/lib/auth-server";

export async function GET() {
  const cookieStore = await cookies();
  const response = await apiRequestWithSession(cookieStore, "/expedientes/catalogo", {
    method: "GET",
  });

  if (!response) {
    return NextResponse.json(
      {
        ok: false,
        mensaje: "Tu sesion no esta disponible o ya expiro.",
        codigo: "SESSION_UNAVAILABLE",
      },
      { status: 401 },
    );
  }

  const payload = (await response.json().catch(() => null)) as
    | Record<string, unknown>
    | null;

  return NextResponse.json(payload ?? { ok: response.ok }, {
    status: response.status,
  });
}
