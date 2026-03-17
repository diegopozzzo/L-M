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
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { expedienteId } = await context.params;
  const cookieStore = await cookies();
  const incoming = await request.formData();
  const archivo = incoming.get("archivo");

  if (!(archivo instanceof File)) {
    return relayJsonResponse(
      new Response(
        JSON.stringify({
          ok: false,
          mensaje: "Debes adjuntar un archivo valido.",
          codigo: "DOCUMENT_REQUIRED",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );
  }

  const body = new FormData();
  body.append("archivo", archivo, archivo.name);

  for (const key of [
    "tipoDocumentoId",
    "fechaDocumento",
    "estadoRevision",
    "descripcionInterna",
    "esConfidencial",
  ]) {
    const value = incoming.get(key);

    if (typeof value === "string" && value.length > 0) {
      body.append(key, value);
    }
  }

  const response = await apiRequestWithSession(
    cookieStore,
    `/expedientes/${expedienteId}/documentos`,
    {
      method: "POST",
      body,
    },
  );

  if (!response) {
    return unauthorizedRouteResponse();
  }

  return relayJsonResponse(response);
}
