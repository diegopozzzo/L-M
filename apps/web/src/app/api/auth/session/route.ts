import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createSessionFromCredentials,
  destroySession,
  getSessionUser,
} from "@/lib/auth-server";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function GET() {
  const cookieStore = await cookies();
  const user = await getSessionUser(cookieStore);

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        mensaje: "No existe una sesion activa.",
        codigo: "SESSION_MISSING",
      },
      { status: 401 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      user,
    },
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as unknown;

  if (
    !isObject(body) ||
    typeof body.email !== "string" ||
    typeof body.password !== "string"
  ) {
    return NextResponse.json(
      {
        ok: false,
        mensaje: "Debes enviar email y password.",
        codigo: "LOGIN_FIELDS_REQUIRED",
      },
      { status: 400 },
    );
  }

  try {
    const cookieStore = await cookies();
    const user = await createSessionFromCredentials(
      cookieStore,
      body.email.trim().toLowerCase(),
      body.password,
    );

    return NextResponse.json({
      ok: true,
      data: {
        user,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        mensaje:
          error instanceof Error
            ? error.message
            : "No fue posible iniciar sesion.",
        codigo: "LOGIN_FAILED",
      },
      { status: 401 },
    );
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  await destroySession(cookieStore);

  return NextResponse.json({
    ok: true,
    mensaje: "Sesion cerrada correctamente.",
  });
}
