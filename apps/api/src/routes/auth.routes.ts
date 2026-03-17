import { Router } from "express";
import { getAuthContext, authenticate } from "../middlewares/auth.js";
import {
  refreshSession,
  revokeSession,
  startSession,
} from "../modules/auth/auth.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { getRequestMetadata } from "../utils/request-metadata.js";
import { AppError } from "../errors/app-error.js";

const authRoutes = Router();

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readLoginBody(body: unknown) {
  if (!isObject(body)) {
    throw new AppError(400, "Debes enviar email y password.", {
      code: "BODY_INVALID",
    });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    throw new AppError(400, "Email y password son obligatorios.", {
      code: "LOGIN_FIELDS_REQUIRED",
    });
  }

  return { email, password };
}

function readRefreshTokenBody(body: unknown) {
  if (!isObject(body) || typeof body.refreshToken !== "string") {
    throw new AppError(400, "Debes enviar un refreshToken valido.", {
      code: "REFRESH_TOKEN_REQUIRED",
    });
  }

  const refreshToken = body.refreshToken.trim();

  if (!refreshToken) {
    throw new AppError(400, "Debes enviar un refreshToken valido.", {
      code: "REFRESH_TOKEN_REQUIRED",
    });
  }

  return refreshToken;
}

authRoutes.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = readLoginBody(req.body);
    const session = await startSession(
      email,
      password,
      getRequestMetadata(req),
    );

    res.status(200).json({
      ok: true,
      mensaje: "Inicio de sesion correcto.",
      data: session,
    });
  }),
);

authRoutes.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const refreshToken = readRefreshTokenBody(req.body);
    const session = await refreshSession(
      refreshToken,
      getRequestMetadata(req),
    );

    res.status(200).json({
      ok: true,
      mensaje: "Sesion renovada correctamente.",
      data: session,
    });
  }),
);

authRoutes.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const refreshToken = readRefreshTokenBody(req.body);
    await revokeSession(refreshToken, getRequestMetadata(req));

    res.status(200).json({
      ok: true,
      mensaje: "Sesion cerrada correctamente.",
    });
  }),
);

authRoutes.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    res.status(200).json({
      ok: true,
      data: getAuthContext(req),
    });
  }),
);

export { authRoutes };
