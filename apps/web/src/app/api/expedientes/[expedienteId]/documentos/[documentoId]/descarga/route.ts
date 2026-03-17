import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { apiRequestWithSession } from "@/lib/auth-server";
import { unauthorizedRouteResponse } from "@/lib/api-route-helpers";

type RouteContext = {
  params: Promise<{
    expedienteId: string;
    documentoId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { expedienteId, documentoId } = await context.params;
  const cookieStore = await cookies();
  const response = await apiRequestWithSession(
    cookieStore,
    `/expedientes/${expedienteId}/documentos/${documentoId}/descarga`,
    {
      method: "GET",
    },
  );

  if (!response) {
    return unauthorizedRouteResponse();
  }

  const contentType =
    response.headers.get("content-type") ?? "application/octet-stream";
  const disposition =
    response.headers.get("content-disposition") ?? "attachment";
  const body = await response.arrayBuffer();

  return new NextResponse(body, {
    status: response.status,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": disposition,
    },
  });
}
