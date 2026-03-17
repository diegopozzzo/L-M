import { env } from "../../config/env.js";
import { AppError } from "../../errors/app-error.js";
import { prisma } from "../../lib/prisma.js";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from "../../utils/auth-tokens.js";
import { hashValue } from "../../utils/hash.js";
import { comparePassword } from "../../utils/password.js";
import type { RequestMetadata } from "../../utils/request-metadata.js";

const usuarioConAccesosInclude = {
  rol: {
    include: {
      permisos: {
        include: {
          permiso: true,
        },
      },
    },
  },
} as const;

async function findUserByEmail(email: string) {
  return prisma.usuario.findFirst({
    where: {
      email,
      deletedAt: null,
    },
    include: usuarioConAccesosInclude,
  });
}

async function findUserById(userId: string) {
  return prisma.usuario.findFirst({
    where: {
      id: userId,
      deletedAt: null,
    },
    include: usuarioConAccesosInclude,
  });
}

type UsuarioConAccesos = NonNullable<Awaited<ReturnType<typeof findUserById>>>;

export type AuthUser = {
  id: string;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  email: string;
  telefono: string | null;
  estado: string;
  ultimoAcceso: Date | null;
  rol: {
    id: string;
    nombre: string;
    descripcion: string | null;
  };
  permisos: string[];
};

export type AuthSession = {
  tokenType: "Bearer";
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
  usuario: AuthUser;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getPermissions(user: UsuarioConAccesos) {
  return [...new Set(user.rol.permisos.map((item) => item.permiso.clave))];
}

function serializeUser(user: UsuarioConAccesos): AuthUser {
  return {
    id: user.id,
    nombres: user.nombres,
    apellidos: user.apellidos,
    nombreCompleto: `${user.nombres} ${user.apellidos}`.trim(),
    email: user.email,
    telefono: user.telefono ?? null,
    estado: user.estado,
    ultimoAcceso: user.ultimoAcceso ?? null,
    rol: {
      id: user.rol.id,
      nombre: user.rol.nombre,
      descripcion: user.rol.descripcion ?? null,
    },
    permisos: getPermissions(user),
  };
}

function assertUserCanAccess(user: UsuarioConAccesos) {
  if (!user.rol.activo) {
    throw new AppError(403, "El rol del usuario se encuentra inactivo.", {
      code: "ROLE_INACTIVE",
    });
  }

  if (user.estado === "BLOQUEADO") {
    throw new AppError(403, "El usuario se encuentra bloqueado.", {
      code: "USER_BLOCKED",
    });
  }

  if (user.estado === "INACTIVO") {
    throw new AppError(403, "El usuario se encuentra inactivo.", {
      code: "USER_INACTIVE",
    });
  }
}

function getAuditPayload(metadata: RequestMetadata) {
  return {
    ip: metadata.ip,
    userAgent: metadata.userAgent,
  };
}

async function createSessionForUser(
  user: UsuarioConAccesos,
  metadata: RequestMetadata,
  action: "auth.login" | "auth.refresh",
): Promise<AuthSession> {
  const usuario = serializeUser(user);
  const refresh = createRefreshToken(user.id);
  const accessToken = createAccessToken({
    sub: user.id,
    email: user.email,
    rol: user.rol.nombre,
    permisos: usuario.permisos,
  });
  const refreshTokenHash = hashValue(refresh.token);
  const now = new Date();

  await prisma.$transaction([
    prisma.refreshToken.create({
      data: {
        usuarioId: user.id,
        jti: refresh.jti,
        tokenHash: refreshTokenHash,
        expiraEn: refresh.expiraEn,
        ip: metadata.ip,
        userAgent: metadata.userAgent,
      },
    }),
    prisma.usuario.update({
      where: { id: user.id },
      data: { ultimoAcceso: now },
    }),
    prisma.auditoriaEvento.create({
      data: {
        usuarioId: user.id,
        entidad: "usuarios",
        entidadId: user.id,
        accion: action,
        detalle: {
          rol: user.rol.nombre,
          permisos: usuario.permisos,
        },
        ...getAuditPayload(metadata),
      },
    }),
  ]);

  return {
    tokenType: "Bearer",
    accessToken,
    refreshToken: refresh.token,
    accessTokenExpiresIn: env.JWT_EXPIRES_IN,
    refreshTokenExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    usuario: {
      ...usuario,
      ultimoAcceso: now,
    },
  };
}

export async function startSession(
  email: string,
  password: string,
  metadata: RequestMetadata,
) {
  const user = await findUserByEmail(normalizeEmail(email));

  if (!user) {
    throw new AppError(401, "Credenciales invalidas.", {
      code: "INVALID_CREDENTIALS",
    });
  }

  assertUserCanAccess(user);

  const passwordMatches = await comparePassword(password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError(401, "Credenciales invalidas.", {
      code: "INVALID_CREDENTIALS",
    });
  }

  return createSessionForUser(user, metadata, "auth.login");
}

export async function refreshSession(
  refreshToken: string,
  metadata: RequestMetadata,
) {
  const payload = verifyRefreshToken(refreshToken);
  const currentSession = await prisma.refreshToken.findUnique({
    where: { jti: payload.jti },
  });

  if (!currentSession || currentSession.usuarioId !== payload.sub) {
    throw new AppError(401, "La sesion ya no es valida.", {
      code: "SESSION_NOT_FOUND",
    });
  }

  if (currentSession.revocadoEn || currentSession.expiraEn <= new Date()) {
    throw new AppError(401, "La sesion ya no es valida.", {
      code: "SESSION_REVOKED",
    });
  }

  if (
    currentSession.tokenHash &&
    currentSession.tokenHash !== hashValue(refreshToken)
  ) {
    throw new AppError(401, "El refresh token no coincide con la sesion activa.", {
      code: "TOKEN_MISMATCH",
    });
  }

  const user = await findUserById(payload.sub);

  if (!user) {
    throw new AppError(401, "El usuario asociado ya no existe.", {
      code: "USER_NOT_FOUND",
    });
  }

  assertUserCanAccess(user);

  const nextSession = await createSessionForUser(user, metadata, "auth.refresh");

  await prisma.refreshToken.update({
    where: { id: currentSession.id },
    data: {
      revocadoEn: new Date(),
    },
  });

  return nextSession;
}

export async function revokeSession(
  refreshToken: string,
  metadata: RequestMetadata,
) {
  const payload = verifyRefreshToken(refreshToken, {
    ignoreExpiration: true,
  });
  const currentSession = await prisma.refreshToken.findUnique({
    where: { jti: payload.jti },
  });

  if (!currentSession || currentSession.usuarioId !== payload.sub) {
    return;
  }

  if (
    currentSession.tokenHash &&
    currentSession.tokenHash !== hashValue(refreshToken)
  ) {
    return;
  }

  if (!currentSession.revocadoEn) {
    await prisma.refreshToken.update({
      where: { id: currentSession.id },
      data: {
        revocadoEn: new Date(),
      },
    });
  }

  await prisma.auditoriaEvento.create({
    data: {
      usuarioId: currentSession.usuarioId,
      entidad: "usuarios",
      entidadId: currentSession.usuarioId,
      accion: "auth.logout",
      detalle: {
        jti: currentSession.jti,
      },
      ...getAuditPayload(metadata),
    },
  });
}

export async function getAuthenticatedUser(userId: string) {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError(401, "El usuario autenticado ya no existe.", {
      code: "USER_NOT_FOUND",
    });
  }

  assertUserCanAccess(user);

  return serializeUser(user);
}
