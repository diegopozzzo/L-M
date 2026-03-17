import type { NextFunction, Request, RequestHandler, Response } from "express";
import { AppError } from "../errors/app-error.js";
import {
  getAuthenticatedUser,
  type AuthUser,
} from "../modules/auth/auth.service.js";
import { verifyAccessToken } from "../utils/auth-tokens.js";

export type AuthenticatedRequest = Request & {
  auth?: AuthUser;
};

function getBearerToken(req: Request) {
  const authorization = req.headers.authorization;

  if (!authorization) {
    throw new AppError(401, "Debes enviar un token Bearer.", {
      code: "AUTH_HEADER_MISSING",
    });
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new AppError(401, "El encabezado Authorization no es valido.", {
      code: "AUTH_HEADER_INVALID",
    });
  }

  return token;
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const token = getBearerToken(req);
    const payload = verifyAccessToken(token);
    const user = await getAuthenticatedUser(payload.sub);

    (req as AuthenticatedRequest).auth = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function getAuthContext(req: Request) {
  const auth = (req as AuthenticatedRequest).auth;

  if (!auth) {
    throw new AppError(401, "No existe una sesion autenticada.", {
      code: "AUTH_CONTEXT_MISSING",
    });
  }

  return auth;
}

export function authorizeRoles(...allowedRoles: string[]): RequestHandler {
  return (req, _res, next) => {
    try {
      const auth = getAuthContext(req);

      if (!allowedRoles.includes(auth.rol.nombre)) {
        throw new AppError(403, "No tienes permisos para esta operacion.", {
          code: "ROLE_FORBIDDEN",
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function authorizePermissions(
  ...requiredPermissions: string[]
): RequestHandler {
  return (req, _res, next) => {
    try {
      const auth = getAuthContext(req);
      const hasAllPermissions = requiredPermissions.every((permission) =>
        auth.permisos.includes(permission),
      );

      if (!hasAllPermissions) {
        throw new AppError(403, "No cuentas con los permisos requeridos.", {
          code: "PERMISSION_FORBIDDEN",
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
