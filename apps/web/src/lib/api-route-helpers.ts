import { NextResponse } from "next/server";

export async function relayJsonResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | Record<string, unknown>
    | null;

  return NextResponse.json(payload ?? { ok: response.ok }, {
    status: response.status,
  });
}

export function unauthorizedRouteResponse() {
  return NextResponse.json(
    {
      ok: false,
      mensaje: "Tu sesion no esta disponible o ya expiro.",
      codigo: "SESSION_UNAVAILABLE",
    },
    { status: 401 },
  );
}
