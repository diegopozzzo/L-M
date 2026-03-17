import {
  EstadoCliente,
  EstadoUsuario,
  OrigenRegistro,
  TipoPersona,
} from "../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";
import type { RequestMetadata } from "../../utils/request-metadata.js";
import { AppError } from "../../errors/app-error.js";
import type { AuthUser } from "../auth/auth.service.js";
import {
  buildVisibleClienteWhere,
  canAccessAllOperationalData,
} from "../shared/visibility.js";

export type ClienteSerializable = {
  id: string;
  nombre: string;
  creadoPorId: string | null;
  creadoPorNombre: string | null;
  esCompartido: boolean;
  tipoPersona: TipoPersona;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  origen: OrigenRegistro;
  estado: EstadoCliente;
  observaciones: string | null;
  contactoPrincipal: {
    id: string;
    nombre: string;
    cargo: string | null;
    email: string | null;
    telefono: string | null;
  } | null;
  expedientesTotales: number;
  expedientesActivos: number;
  createdAt: string;
  updatedAt: string;
};

export type ClientesListResult = {
  items: ClienteSerializable[];
  summary: {
    total: number;
    activos: number;
    potenciales: number;
    archivados: number;
  };
};

export type CreateClienteInput = {
  tipoPersona: TipoPersona;
  nombresORazonSocial: string;
  esCompartido?: boolean;
  tipoDocumento?: string | null;
  numeroDocumento?: string | null;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  observaciones?: string | null;
};

function normalizeOptionalText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function getAuditPayload(metadata: RequestMetadata) {
  return {
    ip: metadata.ip,
    userAgent: metadata.userAgent,
  };
}

function serializeCliente(cliente: {
  id: string;
  tipoPersona: TipoPersona;
  nombresORazonSocial: string;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  origen: OrigenRegistro;
  estado: EstadoCliente;
  esCompartido: boolean;
  observaciones: string | null;
  contactos: Array<{
    id: string;
    nombre: string;
    cargo: string | null;
    email: string | null;
    telefono: string | null;
    esPrincipal: boolean;
  }>;
  creadoPor: {
    id: string;
    nombres: string;
    apellidos: string;
  } | null;
  expedientes: Array<{
    id: string;
    estado: string;
    deletedAt: Date | null;
  }>;
  createdAt: Date;
  updatedAt: Date;
}): ClienteSerializable {
  const contactoPrincipal =
    cliente.contactos.find((contacto) => contacto.esPrincipal) ??
    cliente.contactos[0] ??
    null;
  const expedientesActivos = cliente.expedientes.filter(
    (expediente) =>
      !expediente.deletedAt &&
      expediente.estado !== "CERRADO" &&
      expediente.estado !== "ARCHIVADO",
  ).length;

  return {
    id: cliente.id,
    nombre: cliente.nombresORazonSocial,
    creadoPorId: cliente.creadoPor?.id ?? null,
    creadoPorNombre: cliente.creadoPor
      ? `${cliente.creadoPor.nombres} ${cliente.creadoPor.apellidos}`.trim()
      : null,
    esCompartido: cliente.esCompartido,
    tipoPersona: cliente.tipoPersona,
    tipoDocumento: cliente.tipoDocumento ?? null,
    numeroDocumento: cliente.numeroDocumento ?? null,
    email: cliente.email ?? null,
    telefono: cliente.telefono ?? null,
    direccion: cliente.direccion ?? null,
    origen: cliente.origen,
    estado: cliente.estado,
    observaciones: cliente.observaciones ?? null,
    contactoPrincipal: contactoPrincipal
      ? {
          id: contactoPrincipal.id,
          nombre: contactoPrincipal.nombre,
          cargo: contactoPrincipal.cargo ?? null,
          email: contactoPrincipal.email ?? null,
          telefono: contactoPrincipal.telefono ?? null,
        }
      : null,
    expedientesTotales: cliente.expedientes.length,
    expedientesActivos,
    createdAt: cliente.createdAt.toISOString(),
    updatedAt: cliente.updatedAt.toISOString(),
  };
}

export async function listClientes(auth: AuthUser): Promise<ClientesListResult> {
  const clientes = await prisma.cliente.findMany({
    where: buildVisibleClienteWhere(auth),
    include: {
      creadoPor: {
        select: {
          id: true,
          nombres: true,
          apellidos: true,
        },
      },
      contactos: {
        orderBy: [{ esPrincipal: "desc" }, { createdAt: "asc" }],
      },
      expedientes: {
        select: {
          id: true,
          estado: true,
          deletedAt: true,
        },
      },
    },
    orderBy: [{ estado: "asc" }, { nombresORazonSocial: "asc" }],
  });

  const items = clientes.map(serializeCliente);

  return {
    items,
    summary: {
      total: items.length,
      activos: items.filter((item) => item.estado === EstadoCliente.ACTIVO).length,
      potenciales: items.filter((item) => item.estado === EstadoCliente.POTENCIAL).length,
      archivados: items.filter((item) => item.estado === EstadoCliente.ARCHIVADO).length,
    },
  };
}

export async function createCliente(
  input: CreateClienteInput,
  auth: AuthUser,
  metadata: RequestMetadata,
) {
  const numeroDocumento = normalizeOptionalText(input.numeroDocumento);

  if (numeroDocumento) {
    const existente = await prisma.cliente.findFirst({
      where: {
        numeroDocumento,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (existente) {
      throw new AppError(409, "Ya existe un cliente con ese numero de documento.", {
        code: "CLIENTE_DOCUMENTO_DUPLICATED",
      });
    }
  }

  const created = await prisma.$transaction(async (tx) => {
    const cliente = await tx.cliente.create({
      data: {
        tipoPersona: input.tipoPersona,
        creadoPorId: auth.id,
        nombresORazonSocial: input.nombresORazonSocial.trim(),
        tipoDocumento: normalizeOptionalText(input.tipoDocumento),
        numeroDocumento,
        email: normalizeOptionalText(input.email),
        telefono: normalizeOptionalText(input.telefono),
        direccion: normalizeOptionalText(input.direccion),
        observaciones: normalizeOptionalText(input.observaciones),
        origen: canAccessAllOperationalData(auth)
          ? OrigenRegistro.MANUAL
          : OrigenRegistro.REFERIDO,
        estado: EstadoCliente.ACTIVO,
        esCompartido: input.esCompartido ?? false,
      },
      include: {
        creadoPor: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
          },
        },
        contactos: true,
        expedientes: {
          select: {
            id: true,
            estado: true,
            deletedAt: true,
          },
        },
      },
    });

    await tx.auditoriaEvento.create({
      data: {
        usuarioId: auth.id,
        entidad: "clientes",
        entidadId: cliente.id,
        accion: "clientes.create",
        detalle: {
          tipoPersona: cliente.tipoPersona,
          origen: cliente.origen,
          esCompartido: cliente.esCompartido,
        },
        ...getAuditPayload(metadata),
      },
    });

    return cliente;
  });

  return serializeCliente(created);
}

export async function assertAssignableUser(usuarioId: string) {
  const usuario = await prisma.usuario.findFirst({
    where: {
      id: usuarioId,
      deletedAt: null,
      estado: EstadoUsuario.ACTIVO,
    },
    select: {
      id: true,
    },
  });

  if (!usuario) {
    throw new AppError(404, "No encontramos al usuario seleccionado.", {
      code: "USUARIO_NOT_FOUND",
    });
  }

  return usuario;
}

