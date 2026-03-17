import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { apiRequestWithSession } from "@/lib/auth-server";

type RouteContext = {
  params: Promise<{
    expedienteId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { expedienteId } = await context.params;
  const cookieStore = await cookies();
  const body = await request.text();
  const response = await apiRequestWithSession(
    cookieStore,
    `/expedientes/${expedienteId}/estado`,
    {
      method: "PATCH",
      body,
    },
  );

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
