import { EstadoExpediente } from "../../generated/prisma/enums.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type { AuthUser } from "../auth/auth.service.js";

export function canAccessAllOperationalData(auth: AuthUser) {
  return auth.rol.nombre === "ADMIN" || auth.rol.nombre === "SOCIO";
}

export function buildVisibleExpedienteWhere(
  auth: AuthUser,
): Prisma.ExpedienteWhereInput {
  if (canAccessAllOperationalData(auth)) {
    return {
      deletedAt: null,
    };
  }

  return {
    deletedAt: null,
    OR: [
      { responsableId: auth.id },
      {
        usuarios: {
          some: {
            usuarioId: auth.id,
          },
        },
      },
    ],
  };
}

export function buildActiveExpedienteWhere(
  auth: AuthUser,
): Prisma.ExpedienteWhereInput {
  return {
    AND: [
      buildVisibleExpedienteWhere(auth),
      {
        estado: {
          notIn: [EstadoExpediente.CERRADO, EstadoExpediente.ARCHIVADO],
        },
      },
    ],
  };
}

export function buildVisibleClienteWhere(
  auth: AuthUser,
): Prisma.ClienteWhereInput {
  if (canAccessAllOperationalData(auth)) {
    return {
      deletedAt: null,
    };
  }

  return {
    deletedAt: null,
    OR: [
      { creadoPorId: auth.id },
      { esCompartido: true },
      {
        expedientes: {
          some: buildVisibleExpedienteWhere(auth),
        },
      },
      {
        formulariosContacto: {
          some: buildVisibleLeadWhere(auth),
        },
      },
    ],
  };
}

export function buildVisibleDocumentoWhere(
  auth: AuthUser,
): Prisma.DocumentoWhereInput {
  return {
    deletedAt: null,
    expediente: {
      is: buildVisibleExpedienteWhere(auth),
    },
  };
}

export function buildVisibleAvisoWhere(auth: AuthUser): Prisma.AvisoWhereInput {
  return {
    expediente: {
      is: buildVisibleExpedienteWhere(auth),
    },
  };
}

export function buildVisibleLeadWhere(
  auth: AuthUser,
): Prisma.FormularioContactoWhereInput {
  if (canAccessAllOperationalData(auth)) {
    return {};
  }

  return {
    OR: [
      { creadoPorId: auth.id },
      { asignadoAId: auth.id },
      { esCompartido: true },
    ],
  };
}

