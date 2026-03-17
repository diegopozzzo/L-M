import {
  EstadoAviso,
  EstadoExpediente,
  EstadoLead,
  EstadoRevisionDocumento,
  EstadoUsuario,
} from "../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";
import type { RequestMetadata } from "../../utils/request-metadata.js";
import { AppError } from "../../errors/app-error.js";
import type { AuthUser } from "../auth/auth.service.js";
import {
  buildActiveExpedienteWhere,
  buildVisibleAvisoWhere,
  buildVisibleClienteWhere,
  buildVisibleDocumentoWhere,
  buildVisibleExpedienteWhere,
  buildVisibleLeadWhere,
  canAccessAllOperationalData,
} from "../shared/visibility.js";

export type DashboardOverviewResult = {
  metrics: {
    expedientesActivos: number;
    clientesActivos: number;
    vencimientosPendientes: number;
    documentosTotales: number;
    leadsNuevos: number;
    documentosPorRevisar: number;
  };
  deadlines: Array<{
    id: string;
    titulo: string;
    expedienteId: string;
    expedienteNumero: string;
    cliente: string;
    fechaVencimiento: string;
    diasRestantes: number;
    prioridad: string;
  }>;
  activity: Array<{
    id: string;
    descripcion: string;
    createdAt: string;
    usuario: string | null;
  }>;
  areas: Array<{
    id: string;
    nombre: string;
    expedientes: number;
    porcentaje: number;
  }>;
  teamLoad: Array<{
    id: string;
    nombreCompleto: string;
    rol: string;
    expedientesActivos: number;
    capacidadSugerida: number;
    porcentaje: number;
  }>;
};

export type DocumentoRepoItem = {
  id: string;
  expedienteId: string;
  expedienteNumero: string;
  expedienteTitulo: string;
  cliente: string;
  tipoDocumento: string;
  nombreOriginal: string;
  mimeType: string;
  tamanoBytes: number | null;
  estadoRevision: EstadoRevisionDocumento;
  descripcionInterna: string | null;
  fechaDocumento: string | null;
  subidoPor: string;
  updatedAt: string;
};

export type DocumentosListResult = {
  items: DocumentoRepoItem[];
  summary: {
    total: number;
    porRevisar: number;
    revisados: number;
    observados: number;
  };
};

export type AvisoRepoItem = {
  id: string;
  titulo: string;
  descripcion: string | null;
  expedienteId: string;
  expedienteNumero: string;
  cliente: string;
  tipoAviso: string;
  fechaVencimiento: string;
  fechaRecordatorio: string | null;
  prioridad: string;
  estado: EstadoAviso;
  asignadoA: string;
  diasRestantes: number;
};

export type AvisosListResult = {
  items: AvisoRepoItem[];
  summary: {
    total: number;
    pendientes: number;
    vencidos: number;
    estaSemana: number;
  };
};

export type EquipoMemberItem = {
  id: string;
  nombreCompleto: string;
  email: string;
  telefono: string | null;
  rol: string;
  estado: EstadoUsuario;
  ultimoAcceso: string | null;
  expedientesActivos: number;
  avisosPendientes: number;
  documentosSubidos: number;
};

export type EquipoListResult = {
  items: EquipoMemberItem[];
  summary: {
    total: number;
    socios: number;
    abogados: number;
    asistentes: number;
  };
};

function toNumber(value: bigint | null | undefined) {
  return value === null || value === undefined ? null : Number(value);
}

function serializeDate(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function diffInDays(value: Date) {
  const now = new Date();
  const diff = value.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function humanizeAction(accion: string) {
  const labels: Record<string, string> = {
    "expedientes.create": "registro un nuevo expediente",
    "expedientes.update_status": "actualizo el estado de un expediente",
    "expedientes.update_workspace": "actualizo la ficha de un expediente",
    "expedientes.create_note": "registro una nota interna",
    "documentos.upload": "subio un documento",
    "documentos.update": "actualizo el estado documental",
    "clientes.create": "registro un nuevo cliente",
    "leads.submit_public_contact": "recibio un nuevo formulario web",
    "leads.update": "actualizo un lead comercial",
    "leads.convert": "convirtio un lead en cliente",
    "avisos.update_status": "actualizo un aviso procesal",
  };

  return labels[accion] ?? accion;
}

function getAuditPayload(metadata: RequestMetadata) {
  return {
    ip: metadata.ip,
    userAgent: metadata.userAgent,
  };
}

export async function getDashboardOverview(
  auth: AuthUser,
): Promise<DashboardOverviewResult> {
  const [expedientesActivos, clientesActivos, vencimientosPendientes, documentosTotales, leadsNuevos, documentosPorRevisar, deadlines, activityRaw, activeExpedientes, documentosPendientes] =
    await prisma.$transaction([
      prisma.expediente.count({
        where: buildActiveExpedienteWhere(auth),
      }),
      prisma.cliente.count({
        where: {
          AND: [buildVisibleClienteWhere(auth), { estado: { in: ["ACTIVO", "POTENCIAL"] } }],
        },
      }),
      prisma.aviso.count({
        where: {
          AND: [buildVisibleAvisoWhere(auth), { estado: EstadoAviso.PENDIENTE }],
        },
      }),
      prisma.documento.count({
        where: buildVisibleDocumentoWhere(auth),
      }),
      prisma.formularioContacto.count({
        where: {
          AND: [buildVisibleLeadWhere(auth), { estado: EstadoLead.NUEVO }],
        },
      }),
      prisma.documento.count({
        where: {
          AND: [buildVisibleDocumentoWhere(auth), { estadoRevision: EstadoRevisionDocumento.POR_REVISAR }],
        },
      }),
      prisma.aviso.findMany({
        where: {
          AND: [buildVisibleAvisoWhere(auth), { estado: EstadoAviso.PENDIENTE }],
        },
        include: {
          expediente: {
            include: {
              cliente: true,
            },
          },
        },
        orderBy: { fechaVencimiento: "asc" },
        take: 5,
      }),
      prisma.auditoriaEvento.findMany({
        where: canAccessAllOperationalData(auth) ? undefined : { usuarioId: auth.id },
        include: {
          usuario: true,
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.expediente.findMany({
        where: buildActiveExpedienteWhere(auth),
        select: {
          id: true,
          areaPractica: {
            select: {
              id: true,
              nombre: true,
            },
          },
          responsable: {
            select: {
              id: true,
              nombres: true,
              apellidos: true,
              rol: {
                select: {
                  nombre: true,
                },
              },
            },
          },
        },
      }),
      prisma.documento.findMany({
        where: {
          AND: [buildVisibleDocumentoWhere(auth), { estadoRevision: EstadoRevisionDocumento.POR_REVISAR }],
        },
        select: {
          id: true,
        },
      }),
    ]);

  const areaCounter = new Map<string, { id: string; nombre: string; total: number }>();
  const lawyerCounter = new Map<string, { id: string; nombreCompleto: string; rol: string; total: number }>();

  for (const expediente of activeExpedientes) {
    const currentArea = areaCounter.get(expediente.areaPractica.id);
    areaCounter.set(expediente.areaPractica.id, {
      id: expediente.areaPractica.id,
      nombre: expediente.areaPractica.nombre,
      total: (currentArea?.total ?? 0) + 1,
    });

    const lawyerName = `${expediente.responsable.nombres} ${expediente.responsable.apellidos}`.trim();
    const currentLawyer = lawyerCounter.get(expediente.responsable.id);
    lawyerCounter.set(expediente.responsable.id, {
      id: expediente.responsable.id,
      nombreCompleto: lawyerName,
      rol: expediente.responsable.rol.nombre,
      total: (currentLawyer?.total ?? 0) + 1,
    });
  }

  const totalAreas = Array.from(areaCounter.values()).reduce(
    (accumulator, item) => accumulator + item.total,
    0,
  );

  return {
    metrics: {
      expedientesActivos,
      clientesActivos,
      vencimientosPendientes,
      documentosTotales,
      leadsNuevos,
      documentosPorRevisar: documentosPendientes.length,
    },
    deadlines: deadlines.map((aviso) => ({
      id: aviso.id,
      titulo: aviso.titulo,
      expedienteId: aviso.expediente.id,
      expedienteNumero: aviso.expediente.codigoInterno,
      cliente: aviso.expediente.cliente.nombresORazonSocial,
      fechaVencimiento: aviso.fechaVencimiento.toISOString(),
      diasRestantes: diffInDays(aviso.fechaVencimiento),
      prioridad: aviso.prioridad,
    })),
    activity: activityRaw.map((evento) => ({
      id: evento.id,
      descripcion: humanizeAction(evento.accion),
      createdAt: evento.createdAt.toISOString(),
      usuario: evento.usuario
        ? `${evento.usuario.nombres} ${evento.usuario.apellidos}`.trim()
        : null,
    })),
    areas: Array.from(areaCounter.values())
      .sort((left, right) => right.total - left.total)
      .map((area) => ({
        id: area.id,
        nombre: area.nombre,
        expedientes: area.total,
        porcentaje: totalAreas > 0 ? Math.round((area.total / totalAreas) * 100) : 0,
      })),
    teamLoad: Array.from(lawyerCounter.values())
      .sort((left, right) => right.total - left.total)
      .map((lawyer) => ({
        id: lawyer.id,
        nombreCompleto: lawyer.nombreCompleto,
        rol: lawyer.rol,
        expedientesActivos: lawyer.total,
        capacidadSugerida: 15,
        porcentaje: Math.min(100, Math.round((lawyer.total / 15) * 100)),
      })),
  };
}

export async function listDocumentos(auth: AuthUser): Promise<DocumentosListResult> {
  const documentos = await prisma.documento.findMany({
    where: buildVisibleDocumentoWhere(auth),
    include: {
      expediente: {
        include: {
          cliente: true,
        },
      },
      tipoDocumento: true,
      subidoPor: true,
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });

  const items = documentos.map((documento) => ({
    id: documento.id,
    expedienteId: documento.expedienteId,
    expedienteNumero: documento.expediente.codigoInterno,
    expedienteTitulo: documento.expediente.titulo,
    cliente: documento.expediente.cliente.nombresORazonSocial,
    tipoDocumento: documento.tipoDocumento.nombre,
    nombreOriginal: documento.nombreOriginal,
    mimeType: documento.mimeType,
    tamanoBytes: toNumber(documento.tamanoBytes),
    estadoRevision: documento.estadoRevision,
    descripcionInterna: documento.descripcionInterna ?? null,
    fechaDocumento: serializeDate(documento.fechaDocumento),
    subidoPor: `${documento.subidoPor.nombres} ${documento.subidoPor.apellidos}`.trim(),
    updatedAt: documento.updatedAt.toISOString(),
  }));

  return {
    items,
    summary: {
      total: items.length,
      porRevisar: items.filter((item) => item.estadoRevision === EstadoRevisionDocumento.POR_REVISAR).length,
      revisados: items.filter((item) => item.estadoRevision === EstadoRevisionDocumento.REVISADO).length,
      observados: items.filter((item) => item.estadoRevision === EstadoRevisionDocumento.OBSERVADO).length,
    },
  };
}

export async function listAvisos(auth: AuthUser): Promise<AvisosListResult> {
  const avisos = await prisma.aviso.findMany({
    where: buildVisibleAvisoWhere(auth),
    include: {
      expediente: {
        include: {
          cliente: true,
        },
      },
      asignadoA: true,
    },
    orderBy: [{ fechaVencimiento: "asc" }, { createdAt: "desc" }],
  });

  const items = avisos.map((aviso) => ({
    id: aviso.id,
    titulo: aviso.titulo,
    descripcion: aviso.descripcion ?? null,
    expedienteId: aviso.expedienteId,
    expedienteNumero: aviso.expediente.codigoInterno,
    cliente: aviso.expediente.cliente.nombresORazonSocial,
    tipoAviso: aviso.tipoAviso,
    fechaVencimiento: aviso.fechaVencimiento.toISOString(),
    fechaRecordatorio: serializeDate(aviso.fechaRecordatorio),
    prioridad: aviso.prioridad,
    estado: aviso.estado,
    asignadoA: `${aviso.asignadoA.nombres} ${aviso.asignadoA.apellidos}`.trim(),
    diasRestantes: diffInDays(aviso.fechaVencimiento),
  }));

  return {
    items,
    summary: {
      total: items.length,
      pendientes: items.filter((item) => item.estado === EstadoAviso.PENDIENTE).length,
      vencidos: items.filter((item) => item.diasRestantes < 0 && item.estado === EstadoAviso.PENDIENTE).length,
      estaSemana: items.filter((item) => item.diasRestantes >= 0 && item.diasRestantes <= 7).length,
    },
  };
}

export async function updateAvisoStatus(
  avisoId: string,
  estado: EstadoAviso,
  auth: AuthUser,
  metadata: RequestMetadata,
) {
  const aviso = await prisma.aviso.findFirst({
    where: {
      id: avisoId,
      AND: [buildVisibleAvisoWhere(auth)],
    },
    include: {
      expediente: {
        include: {
          cliente: true,
        },
      },
      asignadoA: true,
    },
  });

  if (!aviso) {
    throw new AppError(404, "No encontramos el aviso solicitado.", {
      code: "AVISO_NOT_FOUND",
    });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const nextAviso = await tx.aviso.update({
      where: {
        id: avisoId,
      },
      data: {
        estado,
        completadoEn: estado === EstadoAviso.COMPLETADO ? new Date() : null,
      },
      include: {
        expediente: {
          include: {
            cliente: true,
          },
        },
        asignadoA: true,
      },
    });

    await tx.auditoriaEvento.create({
      data: {
        usuarioId: auth.id,
        entidad: "avisos",
        entidadId: avisoId,
        accion: "avisos.update_status",
        detalle: {
          estadoAnterior: aviso.estado,
          estadoNuevo: estado,
        },
        ...getAuditPayload(metadata),
      },
    });

    return nextAviso;
  });

  return {
    id: updated.id,
    titulo: updated.titulo,
    descripcion: updated.descripcion ?? null,
    expedienteId: updated.expedienteId,
    expedienteNumero: updated.expediente.codigoInterno,
    cliente: updated.expediente.cliente.nombresORazonSocial,
    tipoAviso: updated.tipoAviso,
    fechaVencimiento: updated.fechaVencimiento.toISOString(),
    fechaRecordatorio: serializeDate(updated.fechaRecordatorio),
    prioridad: updated.prioridad,
    estado: updated.estado,
    asignadoA: `${updated.asignadoA.nombres} ${updated.asignadoA.apellidos}`.trim(),
    diasRestantes: diffInDays(updated.fechaVencimiento),
  } satisfies AvisoRepoItem;
}

export async function listEquipo(auth: AuthUser): Promise<EquipoListResult> {
  if (!canAccessAllOperationalData(auth) && !auth.permisos.includes("usuarios.read")) {
    throw new AppError(403, "No cuentas con acceso al modulo de equipo.", {
      code: "TEAM_FORBIDDEN",
    });
  }

  const usuarios = await prisma.usuario.findMany({
    where: {
      deletedAt: null,
      estado: {
        in: [EstadoUsuario.ACTIVO, EstadoUsuario.INACTIVO],
      },
    },
    include: {
      rol: true,
      expedientesResponsables: {
        where: {
          deletedAt: null,
          estado: {
            notIn: [EstadoExpediente.CERRADO, EstadoExpediente.ARCHIVADO],
          },
        },
        select: {
          id: true,
        },
      },
      avisosAsignados: {
        where: {
          estado: EstadoAviso.PENDIENTE,
        },
        select: {
          id: true,
        },
      },
      documentosSubidos: {
        where: {
          deletedAt: null,
        },
        select: {
          id: true,
        },
      },
    },
    orderBy: [{ rol: { nombre: "asc" } }, { nombres: "asc" }, { apellidos: "asc" }],
  });

  const items = usuarios.map((usuario) => ({
    id: usuario.id,
    nombreCompleto: `${usuario.nombres} ${usuario.apellidos}`.trim(),
    email: usuario.email,
    telefono: usuario.telefono ?? null,
    rol: usuario.rol.nombre,
    estado: usuario.estado,
    ultimoAcceso: serializeDate(usuario.ultimoAcceso),
    expedientesActivos: usuario.expedientesResponsables.length,
    avisosPendientes: usuario.avisosAsignados.length,
    documentosSubidos: usuario.documentosSubidos.length,
  }));

  return {
    items,
    summary: {
      total: items.length,
      socios: items.filter((item) => item.rol === "SOCIO").length,
      abogados: items.filter((item) => item.rol === "ABOGADO").length,
      asistentes: items.filter((item) => item.rol === "ASISTENTE").length,
    },
  };
}

