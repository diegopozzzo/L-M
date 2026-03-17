import { cookies } from "next/headers";
import { apiRequestWithSession } from "@/lib/auth-server";
import { relayJsonResponse, unauthorizedRouteResponse } from "@/lib/api-route-helpers";

type RouteContext = {
  params: Promise<{
    avisoId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { avisoId } = await context.params;
  const cookieStore = await cookies();
  const response = await apiRequestWithSession(cookieStore, `/avisos/${avisoId}/estado`, {
    method: "PATCH",
    body: await request.text(),
  });

  if (!response) {
    return unauthorizedRouteResponse();
  }

  return relayJsonResponse(response);
}

