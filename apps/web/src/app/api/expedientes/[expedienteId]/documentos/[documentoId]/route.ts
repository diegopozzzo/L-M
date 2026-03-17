import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { apiRequestWithSession } from "@/lib/auth-server";
import {
  relayJsonResponse,
  unauthorizedRouteResponse,
} from "@/lib/api-route-helpers";

type RouteContext = {
  params: Promise<{
    expedienteId: string;
    documentoId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { expedienteId, documentoId } = await context.params;
  const cookieStore = await cookies();
  const body = await request.text();
  const response = await apiRequestWithSession(
    cookieStore,
    `/expedientes/${expedienteId}/documentos/${documentoId}`,
    {
      method: "PATCH",
      body,
    },
  );

  if (!response) {
    return unauthorizedRouteResponse();
  }

  return relayJsonResponse(response);
}
