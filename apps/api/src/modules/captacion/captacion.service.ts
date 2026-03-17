import {
  EstadoCliente,
  EstadoLead,
  EstadoUsuario,
  OrigenRegistro,
  TipoPersona,
} from "../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";
import type { RequestMetadata } from "../../utils/request-metadata.js";
import { AppError } from "../../errors/app-error.js";
import type { AuthUser } from "../auth/auth.service.js";
import {
  buildVisibleLeadWhere,
  canAccessAllOperationalData,
} from "../shared/visibility.js";

export type ContactCatalogoResult = {
  areasPractica: Array<{
    id: string;
    nombre: string;
    slug: string;
  }>;
};

export type LeadSerializable = {
  id: string;
  creadoPor: {
    id: string;
    nombreCompleto: string;
  } | null;
  esCompartido: boolean;
  nombre: string;
  email: string;
  telefono: string | null;
  empresa: string | null;
  mensaje: string;
  origenUrl: string | null;
  estado: EstadoLead;
  areaPractica: {
    id: string;
    nombre: string;
    slug: string;
  } | null;
  asignadoA: {
    id: string;
    nombreCompleto: string;
  } | null;
  cliente: {
    id: string;
    nombre: string;
    estado: EstadoCliente;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type LeadsListResult = {
  items: LeadSerializable[];
  summary: {
    total: number;
    nuevos: number;
    enRevision: number;
    contactados: number;
    convertidos: number;
  };
};

export type SubmitContactInput = {
  nombre: string;
  email: string;
  telefono?: string | null;
  empresa?: string | null;
  mensaje: string;
  areaPracticaId?: string | null;
  origenUrl?: string | null;
};

export type UpdateLeadInput = {
  estado?: EstadoLead;
  asignadoAId?: string | null;
  esCompartido?: boolean;
};

export type CreateLeadInput = SubmitContactInput & {
  asignadoAId?: string | null;
  estado?: EstadoLead;
  esCompartido?: boolean;
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

function serializeLead(lead: {
  id: string;
  creadoPor: { id: string; nombres: string; apellidos: string } | null;
  esCompartido: boolean;
  nombre: string;
  email: string;
  telefono: string | null;
  empresa: string | null;
  mensaje: string;
  origenUrl: string | null;
  estado: EstadoLead;
  areaPractica: { id: string; nombre: string; slug: string } | null;
  asignadoA: { id: string; nombres: string; apellidos: string } | null;
  cliente: { id: string; nombresORazonSocial: string; estado: EstadoCliente } | null;
  createdAt: Date;
  updatedAt: Date;
}): LeadSerializable {
  return {
    id: lead.id,
    creadoPor: lead.creadoPor
      ? {
          id: lead.creadoPor.id,
          nombreCompleto: `${lead.creadoPor.nombres} ${lead.creadoPor.apellidos}`.trim(),
        }
      : null,
    esCompartido: lead.esCompartido,
    nombre: lead.nombre,
    email: lead.email,
    telefono: lead.telefono ?? null,
    empresa: lead.empresa ?? null,
    mensaje: lead.mensaje,
    origenUrl: lead.origenUrl ?? null,
    estado: lead.estado,
    areaPractica: lead.areaPractica,
    asignadoA: lead.asignadoA
      ? {
          id: lead.asignadoA.id,
          nombreCompleto: `${lead.asignadoA.nombres} ${lead.asignadoA.apellidos}`.trim(),
        }
      : null,
    cliente: lead.cliente
      ? {
          id: lead.cliente.id,
          nombre: lead.cliente.nombresORazonSocial,
          estado: lead.cliente.estado,
        }
      : null,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}

async function resolveAreaPracticaId(areaPracticaId?: string | null) {
  if (!areaPracticaId) {
    return null;
  }

  const area = await prisma.areaPractica.findFirst({
    where: {
      id: areaPracticaId,
      activa: true,
    },
    select: {
      id: true,
    },
  });

  if (!area) {
    throw new AppError(404, "No encontramos el area de practica seleccionada.", {
      code: "AREA_PRACTICA_NOT_FOUND",
    });
  }

  return area.id;
}

async function resolveAssignableLeadOwner() {
  const usuario = await prisma.usuario.findFirst({
    where: {
      deletedAt: null,
      estado: EstadoUsuario.ACTIVO,
      rol: {
        nombre: {
          in: ["SOCIO", "ADMIN"],
        },
      },
    },
    orderBy: [{ rol: { nombre: "asc" } }, { createdAt: "asc" }],
    select: {
      id: true,
    },
  });

  return usuario?.id ?? null;
}

async function getLeadOrThrow(leadId: string, auth: AuthUser) {
  const lead = await prisma.formularioContacto.findFirst({
    where: {
      id: leadId,
      AND: [buildVisibleLeadWhere(auth)],
    },
    include: {
      creadoPor: true,
      areaPractica: true,
      asignadoA: true,
      cliente: true,
    },
  });

  if (!lead) {
    throw new AppError(404, "No encontramos el lead solicitado.", {
      code: "LEAD_NOT_FOUND",
    });
  }

  return lead;
}

export async function getContactCatalogo(): Promise<ContactCatalogoResult> {
  const areasPractica = await prisma.areaPractica.findMany({
    where: {
      activa: true,
    },
    select: {
      id: true,
      nombre: true,
      slug: true,
    },
    orderBy: {
      nombre: "asc",
    },
  });

  return {
    areasPractica,
  };
}

export async function submitPublicContact(
  input: SubmitContactInput,
  metadata: RequestMetadata,
) {
  const email = input.email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError(400, "Debes ingresar un correo valido.", {
      code: "LEAD_EMAIL_INVALID",
    });
  }

  const [areaPracticaId, asignadoAId] = await Promise.all([
    resolveAreaPracticaId(input.areaPracticaId),
    resolveAssignableLeadOwner(),
  ]);

  const lead = await prisma.$transaction(async (tx) => {
    const created = await tx.formularioContacto.create({
      data: {
        nombre: input.nombre.trim(),
        email,
        telefono: normalizeOptionalText(input.telefono),
        empresa: normalizeOptionalText(input.empresa),
        mensaje: input.mensaje.trim(),
        origenUrl: normalizeOptionalText(input.origenUrl),
        origen: OrigenRegistro.WEB,
        areaPracticaId,
        asignadoAId,
      },
      include: {
        creadoPor: true,
        areaPractica: true,
        asignadoA: true,
        cliente: true,
      },
    });

    await tx.auditoriaEvento.create({
      data: {
        entidad: "formularios_contacto",
        entidadId: created.id,
        accion: "leads.submit_public_contact",
        detalle: {
          email: created.email,
          areaPracticaId: created.areaPracticaId,
        },
        ...getAuditPayload(metadata),
      },
    });

    return created;
  });

  return serializeLead(lead);
}

export async function listLeads(auth: AuthUser): Promise<LeadsListResult> {
  const leads = await prisma.formularioContacto.findMany({
    where: buildVisibleLeadWhere(auth),
    include: {
      creadoPor: true,
      areaPractica: true,
      asignadoA: true,
      cliente: true,
    },
    orderBy: [{ estado: "asc" }, { createdAt: "desc" }],
  });

  const items = leads.map(serializeLead);

  return {
    items,
    summary: {
      total: items.length,
      nuevos: items.filter((item) => item.estado === EstadoLead.NUEVO).length,
      enRevision: items.filter((item) => item.estado === EstadoLead.EN_REVISION).length,
      contactados: items.filter((item) => item.estado === EstadoLead.CONTACTADO).length,
      convertidos: items.filter((item) => item.estado === EstadoLead.CONVERTIDO).length,
    },
  };
}

export async function updateLead(
  leadId: string,
  input: UpdateLeadInput,
  auth: AuthUser,
  metadata: RequestMetadata,
) {
  const lead = await getLeadOrThrow(leadId, auth);

  if (input.asignadoAId) {
    if (!canAccessAllOperationalData(auth) && input.asignadoAId !== auth.id) {
      throw new AppError(
        403,
        "Solo puedes asignarte leads propios o compartidos a ti mismo.",
        {
          code: "LEAD_ASSIGNMENT_FORBIDDEN",
        },
      );
    }

    const usuario = await prisma.usuario.findFirst({
      where: {
        id: input.asignadoAId,
        deletedAt: null,
        estado: EstadoUsuario.ACTIVO,
      },
      select: {
        id: true,
      },
    });

    if (!usuario) {
      throw new AppError(404, "No encontramos al usuario seleccionado.", {
        code: "LEAD_ASSIGNEE_NOT_FOUND",
      });
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const nextLead = await tx.formularioContacto.update({
      where: {
        id: leadId,
      },
      data: {
        estado: input.estado ?? lead.estado,
        asignadoAId:
          input.asignadoAId === undefined ? lead.asignadoAId : input.asignadoAId,
        esCompartido:
          input.esCompartido === undefined ? lead.esCompartido : input.esCompartido,
      },
      include: {
        creadoPor: true,
        areaPractica: true,
        asignadoA: true,
        cliente: true,
      },
    });

    await tx.auditoriaEvento.create({
      data: {
        usuarioId: auth.id,
        entidad: "formularios_contacto",
        entidadId: leadId,
        accion: "leads.update",
        detalle: {
          estadoAnterior: lead.estado,
          estadoNuevo: input.estado ?? lead.estado,
          asignadoAnterior: lead.asignadoAId,
          asignadoNuevo:
            input.asignadoAId === undefined ? lead.asignadoAId : input.asignadoAId,
          compartidoAnterior: lead.esCompartido,
          compartidoNuevo:
            input.esCompartido === undefined ? lead.esCompartido : input.esCompartido,
        },
        ...getAuditPayload(metadata),
      },
    });

    return nextLead;
  });

  return serializeLead(updated);
}

export async function convertLeadToCliente(
  leadId: string,
  auth: AuthUser,
  metadata: RequestMetadata,
) {
  const lead = await getLeadOrThrow(leadId, auth);

  const existingClient = lead.clienteId
    ? await prisma.cliente.findUnique({
        where: { id: lead.clienteId },
        select: { id: true },
      })
    : await prisma.cliente.findFirst({
        where: {
          deletedAt: null,
          OR: [{ email: lead.email }, { nombresORazonSocial: lead.empresa ?? lead.nombre }],
        },
        select: { id: true },
      });

  const updatedLead = await prisma.$transaction(async (tx) => {
    const clienteId = existingClient?.id
      ? existingClient.id
      : (
          await tx.cliente.create({
            data: {
              creadoPorId: auth.id,
              tipoPersona: lead.empresa ? TipoPersona.JURIDICA : TipoPersona.NATURAL,
              nombresORazonSocial: lead.empresa ?? lead.nombre,
              email: lead.email,
              telefono: lead.telefono,
              origen: OrigenRegistro.WEB,
              estado: EstadoCliente.ACTIVO,
              esCompartido: lead.esCompartido,
              observaciones: `Cliente convertido desde lead ${lead.id}.`,
              contactos: lead.empresa
                ? {
                    create: {
                      nombre: lead.nombre,
                      cargo: "Contacto inicial",
                      email: lead.email,
                      telefono: lead.telefono,
                      esPrincipal: true,
                    },
                  }
                : undefined,
            },
            select: {
              id: true,
            },
          })
        ).id;

    const nextLead = await tx.formularioContacto.update({
      where: {
        id: leadId,
      },
      data: {
        clienteId,
        estado: EstadoLead.CONVERTIDO,
      },
      include: {
        creadoPor: true,
        areaPractica: true,
        asignadoA: true,
        cliente: true,
      },
    });

    await tx.auditoriaEvento.create({
      data: {
        usuarioId: auth.id,
        entidad: "formularios_contacto",
        entidadId: leadId,
        accion: "leads.convert",
        detalle: {
          clienteId,
        },
        ...getAuditPayload(metadata),
      },
    });

    return nextLead;
  });

  return serializeLead(updatedLead);
}

export async function createLead(
  input: CreateLeadInput,
  auth: AuthUser,
  metadata: RequestMetadata,
) {
  const email = input.email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError(400, "Debes ingresar un correo valido.", {
      code: "LEAD_EMAIL_INVALID",
    });
  }

  const areaPracticaId = await resolveAreaPracticaId(input.areaPracticaId);
  const requestedAssigneeId =
    input.asignadoAId === undefined || input.asignadoAId === ""
      ? null
      : input.asignadoAId;
  const asignadoAId = canAccessAllOperationalData(auth)
    ? requestedAssigneeId
    : auth.id;

  if (asignadoAId) {
    const usuario = await prisma.usuario.findFirst({
      where: {
        id: asignadoAId,
        deletedAt: null,
        estado: EstadoUsuario.ACTIVO,
      },
      select: {
        id: true,
      },
    });

    if (!usuario) {
      throw new AppError(404, "No encontramos al usuario seleccionado.", {
        code: "LEAD_ASSIGNEE_NOT_FOUND",
      });
    }
  }

  const created = await prisma.$transaction(async (tx) => {
    const lead = await tx.formularioContacto.create({
      data: {
        creadoPorId: auth.id,
        nombre: input.nombre.trim(),
        email,
        telefono: normalizeOptionalText(input.telefono),
        empresa: normalizeOptionalText(input.empresa),
        mensaje: input.mensaje.trim(),
        areaPracticaId,
        asignadoAId,
        estado: input.estado ?? EstadoLead.NUEVO,
        esCompartido: input.esCompartido ?? false,
        origen: OrigenRegistro.MANUAL,
        origenUrl: normalizeOptionalText(input.origenUrl) ?? "/intranet",
      },
      include: {
        creadoPor: true,
        areaPractica: true,
        asignadoA: true,
        cliente: true,
      },
    });

    await tx.auditoriaEvento.create({
      data: {
        usuarioId: auth.id,
        entidad: "formularios_contacto",
        entidadId: lead.id,
        accion: "leads.create",
        detalle: {
          estado: lead.estado,
          asignadoAId: lead.asignadoAId,
          esCompartido: lead.esCompartido,
        },
        ...getAuditPayload(metadata),
      },
    });

    return lead;
  });

  return serializeLead(created);
}

