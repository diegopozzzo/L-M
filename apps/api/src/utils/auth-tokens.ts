import { randomUUID } from "node:crypto";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";

type TokenKind = "access" | "refresh";

export type AccessTokenPayload = {
  sub: string;
  email: string;
  rol: string;
  permisos: string[];
  typ: "access";
};

export type RefreshTokenPayload = {
  sub: string;
  jti: string;
  typ: "refresh";
};

function getExpiresIn(value: string) {
  return value as SignOptions["expiresIn"];
}

function getSecret(secret: string, envKey: string) {
  if (!secret) {
    throw new AppError(500, `Falta configurar la variable ${envKey}.`, {
      code: "ENV_MISSING",
    });
  }

  return secret;
}

function normalizePayload(
  decoded: string | JwtPayload,
  expectedType: TokenKind,
): JwtPayload & { sub: string; typ: TokenKind } {
  if (typeof decoded === "string") {
    throw new AppError(401, "El token recibido no es valido.", {
      code: "TOKEN_INVALID",
    });
  }

  if (!decoded.sub || decoded.typ !== expectedType) {
    throw new AppError(401, "La estructura del token no es valida.", {
      code: "TOKEN_INVALID",
    });
  }

  return decoded as JwtPayload & { sub: string; typ: TokenKind };
}

function mapTokenError(error: unknown): never {
  if (error instanceof AppError) {
    throw error;
  }

  if (error instanceof jwt.TokenExpiredError) {
    throw new AppError(401, "La sesion expiro. Vuelve a iniciar sesion.", {
      code: "TOKEN_EXPIRED",
    });
  }

  if (error instanceof jwt.JsonWebTokenError) {
    throw new AppError(401, "El token de autenticacion es invalido.", {
      code: "TOKEN_INVALID",
    });
  }

  throw error;
}

export function createAccessToken(payload: Omit<AccessTokenPayload, "typ">) {
  return jwt.sign(
    { ...payload, typ: "access" },
    getSecret(env.JWT_SECRET, "JWT_SECRET"),
    { expiresIn: getExpiresIn(env.JWT_EXPIRES_IN) },
  );
}

export function createRefreshToken(userId: string) {
  const jti = randomUUID();
  const token = jwt.sign(
    { sub: userId, jti, typ: "refresh" },
    getSecret(env.JWT_REFRESH_SECRET, "JWT_REFRESH_SECRET"),
    { expiresIn: getExpiresIn(env.JWT_REFRESH_EXPIRES_IN) },
  );

  const decoded = jwt.decode(token);
  const payload = normalizePayload(decoded as string | JwtPayload, "refresh");

  if (!payload.exp) {
    throw new AppError(500, "No fue posible calcular la expiracion del token.", {
      code: "TOKEN_EXP_MISSING",
    });
  }

  return {
    token,
    jti,
    expiraEn: new Date(payload.exp * 1000),
  };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(
      token,
      getSecret(env.JWT_SECRET, "JWT_SECRET"),
    );
    const payload = normalizePayload(decoded, "access");

    if (!payload.email || !payload.rol || !Array.isArray(payload.permisos)) {
      throw new AppError(401, "El token de acceso no contiene datos validos.", {
        code: "TOKEN_INVALID",
      });
    }

    return {
      sub: payload.sub,
      email: String(payload.email),
      rol: String(payload.rol),
      permisos: payload.permisos.map((permiso) => String(permiso)),
      typ: "access",
    };
  } catch (error) {
    mapTokenError(error);
  }
}

export function verifyRefreshToken(
  token: string,
  options?: { ignoreExpiration?: boolean },
): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(
      token,
      getSecret(env.JWT_REFRESH_SECRET, "JWT_REFRESH_SECRET"),
      {
        ignoreExpiration: options?.ignoreExpiration ?? false,
      },
    );
    const payload = normalizePayload(decoded, "refresh");

    if (!payload.jti) {
      throw new AppError(401, "El refresh token no contiene un identificador.", {
        code: "TOKEN_INVALID",
      });
    }

    return {
      sub: payload.sub,
      jti: String(payload.jti),
      typ: "refresh",
    };
  } catch (error) {
    mapTokenError(error);
  }
}
