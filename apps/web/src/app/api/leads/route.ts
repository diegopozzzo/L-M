import { cookies } from "next/headers";
import { apiRequestWithSession } from "@/lib/auth-server";
import { relayJsonResponse, unauthorizedRouteResponse } from "@/lib/api-route-helpers";

export async function GET() {
  const cookieStore = await cookies();
  const response = await apiRequestWithSession(cookieStore, "/leads", {
    method: "GET",
  });

  if (!response) {
    return unauthorizedRouteResponse();
  }

  return relayJsonResponse(response);
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const response = await apiRequestWithSession(cookieStore, "/leads", {
    method: "POST",
    body: await request.text(),
  });

  if (!response) {
    return unauthorizedRouteResponse();
  }

  return relayJsonResponse(response);
}

