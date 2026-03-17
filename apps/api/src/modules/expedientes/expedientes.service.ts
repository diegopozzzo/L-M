import { createHash } from "node:crypto";
import {
  EstadoAviso,
  EstadoExpediente,
  EstadoRevisionDocumento,
  EstadoUsuario,
  NivelConfidencialidad,
  Prioridad,
  RolEnExpediente,
  TipoNotaExpediente,
  VisibilidadNota,
} from "../../generated/prisma/enums.js";
import {
  type Prisma,
} from "../../generated/prisma/client.js";
import { AppError } from "../../errors/app-error.js";
import { prisma } from "../../lib/prisma.js";
import type { RequestMetadata } from "../../utils/request-metadata.js";
import type { AuthUser } from "../auth/auth.service.js";
import { canAccessAllOperationalData } from "../shared/visibility.js";

const MAX_DOCUMENT_SIZE_BYTES = 12 * 1024 * 1024;

const expedienteInclude = {
  cliente: true,
  areaPractica: true,
  responsable: {
    include: {
      rol: true,
    },
  },
  actuaciones: {
    orderBy: {
      fechaEvento: "desc",
    },
    take: 1,
  },
} satisfies Prisma.ExpedienteInclude;

const expedienteDetailInclude = {
  cliente: true,
  areaPractica: true,
  responsable: {
    include: {
      rol: true,
    },
  },
  usuarios: {
    orderBy: {
      createdAt: "asc",
    },
    include: {
      usuario: {
        include: {
          rol: true,
        },
      },
    },
  },
  actuaciones: {
    orderBy: {
      fechaEvento: "desc",
    },
    take: 8,
    include: {
      usuario: {
        include: {
          rol: true,
        },
      },
    },
  },
  documentos: {
    where: {
      deletedAt: null,
    },
    orderBy: [{ createdAt: "desc" }, { nombreOriginal: "asc" }],
    include: {
      tipoDocumento: true,
      subidoPor: {
        include: {
          rol: true,
        },
      },
    },
  },
  notas: {
    orderBy: [{ destacado: "desc" }, { updatedAt: "desc" }],
    include: {
      autor: {
        include: {
          rol: true,
        },
      },
    },
  },
  avisos: {
    where: {
      estado: EstadoAviso.PENDIENTE,
    },
    orderBy: {
      fechaVencimiento: "asc",
    },
    take: 6,
    include: {
      asignadoA: {
        include: {
          rol: true,
        },
      },
    },
  },
} satisfies Prisma.ExpedienteInclude;

type ExpedienteConRelaciones = Prisma.ExpedienteGetPayload<{
  include: typeof expedienteInclude;
}>;

type ExpedienteDetalleConRelaciones = Prisma.ExpedienteGetPayload<{
  include: typeof expedienteDetailInclude;
}>;

type DocumentoConRelaciones = Prisma.DocumentoGetPayload<{
  include: {
    tipoDocumento: true;
    subidoPor: {
      include: {
        rol: true;
      };
    };
    expediente: {
      include: typeof expedienteInclude;
    };
  };
}>;

type NotaConRelaciones = Prisma.NotaExpedienteGetPayload<{
  include: {
    autor: {
      include: {
        rol: true;
      };
    };
  };
}>;

export type ExpedienteEstadoVista = "ACTIVO" | "PENDIENTE" | "URGENTE" | "CERRADO";

export type ExpedienteSerializable = {
  id: string;
  numero: string;
  titulo: string;
  descripcion: string | null;
  clienteId: string;
  cliente: string;
  areaPracticaId: string;
  materia: string;
  responsableId: string;
  abogado: string;
  contraparte: string | null;
  organoJudicial: string | null;
  numeroExpedienteExterno: string | null;
  prioridad: Prioridad;
  estadoInterno: EstadoExpediente;
  estadoVista: ExpedienteEstadoVista;
  nivelConfidencialidad: NivelConfidencialidad;
  fechaApertura: string;
  fechaCierre: string | null;
  ultimaActuacion: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExpedienteDocumentoSerializable = {
  id: string;
  nombreOriginal: string;
  nombreAlmacenado: string;
  mimeType: string;
  tamanoBytes: number | null;
  hashSha256: string | null;
  version: number;
  fechaDocumento: string | null;
  estadoRevision: EstadoRevisionDocumento;
  descripcionInterna: string | null;
  esConfidencial: boolean;
  tipoDocumento: {
    id: string;
    nombre: string;
  };
  subidoPor: {
    id: string;
    nombreCompleto: string;
    rol: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type ExpedienteNotaSerializable = {
  id: string;
  titulo: string | null;
  tipo: TipoNotaExpediente;
  contenido: string;
  destacado: boolean;
  visibilidad: VisibilidadNota;
  autor: {
    id: string;
    nombreCompleto: string;
    rol: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type ExpedienteActuacionSerializable = {
  id: string;
  tipo: string;
  fechaEvento: string;
  descripcion: string;
  resultado: string | null;
  proximaAccion: string | null;
  usuario: {
    id: string;
    nombreCompleto: string;
    rol: string;
  };
};

export type ExpedienteParticipanteSerializable = {
  id: string;
  recibeAlertas: boolean;
  rolEnExpediente: RolEnExpediente;
  usuario: {
    id: string;
    nombreCompleto: string;
    rol: string;
    email: string;
  };
};

export type ExpedienteAvisoSerializable = {
  id: string;
  titulo: string;
  descripcion: string | null;
  fechaVencimiento: string;
  prioridad: Prioridad;
  asignadoA: {
    id: string;
    nombreCompleto: string;
  };
};

export type ExpedienteDetalleSerializable = {
  expediente: ExpedienteSerializable & {
    resumenEjecutivo: string | null;
    siguientePaso: string | null;
  };
  documentos: ExpedienteDocumentoSerializable[];
  notas: ExpedienteNotaSerializable[];
  actuaciones: ExpedienteActuacionSerializable[];
  participantes: ExpedienteParticipanteSerializable[];
  avisos: ExpedienteAvisoSerializable[];
  metricas: {
    documentosTotales: number;
    documentosRevisados: number;
    documentosPorRevisar: number;
    documentosObservados: number;
    notasTotales: number;
    actuacionesTotales: number;
  };
};

export type ListExpedientesResult = {
  items: ExpedienteSerializable[];
  summary: {
    total: number;
    activos: number;
    pendientes: number;
    urgentes: number;
    cerrados: number;
  };
};

export type CatalogoExpedientesResult = {
  clientes: Array<{
    id: string;
    nombre: string;
    tipoPersona: string;
  }>;
  areasPractica: Array<{
    id: string;
    nombre: string;
    slug: string;
  }>;
  responsables: Array<{
    id: string;
    nombreCompleto: string;
    rol: string;
  }>;
  tiposDocumento: Array<{
    id: string;
    nombre: string;
  }>;
  opciones: {
    estados: EstadoExpediente[];
    prioridades: Prioridad[];
    nivelesConfidencialidad: NivelConfidencialidad[];
    estadosRevisionDocumento: EstadoRevisionDocumento[];
    tiposNota: TipoNotaExpediente[];
    visibilidadesNota: VisibilidadNota[];
  };
};

export type CreateExpedienteInput = {
  codigoInterno: string;
  clienteId: string;
  areaPracticaId: string;
  responsableId: string;
  titulo: string;
  descripcion?: string | null;
  contraparte?: string | null;
  organoJudicial?: string | null;
  numeroExpedienteExterno?: string | null;
  prioridad?: Prioridad;
  nivelConfidencialidad?: NivelConfidencialidad;
  fechaApertura?: Date;
};

export type UpdateExpedienteStatusInput = {
  estado: EstadoExpediente;
};

export type UpdateExpedienteWorkspaceInput = {
  resumenEjecutivo?: string | null;
  siguientePaso?: string | null;
};

export type CreateExpedienteNoteInput = {
  titulo?: string | null;
  tipo: TipoNotaExpediente;
  contenido: string;
  destacado?: boolean;
  visibilidad?: VisibilidadNota;
};

export type UploadExpedienteDocumentInput = {
  tipoDocumentoId: string;
  nombreOriginal: string;
  mimeType: string;
  fechaDocumento?: Date | null;
  estadoRevision?: EstadoRevisionDocumento;
  descripcionInterna?: string | null;
  esConfidencial?: boolean;
  fileBuffer: Buffer;
};

export type UpdateExpedienteDocumentInput = {
  estadoRevision?: EstadoRevisionDocumento;
  descripcionInterna?: string | null;
};

export type DocumentoDescargaResult = {
  mimeType: string;
  nombreArchivo: string;
  contenido: Buffer;
};

function canAccessAllExpedientes(auth: AuthUser) {
  return auth.rol.nombre === "ADMIN" || auth.rol.nombre === "SOCIO";
}

function buildVisibleWhere(auth: AuthUser): Prisma.ExpedienteWhereInput {
  if (canAccessAllExpedientes(auth)) {
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

function buildSearchWhere(search?: string): Prisma.ExpedienteWhereInput | null {
  const normalized = search?.trim();

  if (!normalized) {
    return null;
  }

  return {
    OR: [
      {
        codigoInterno: {
          contains: normalized,
          mode: "insensitive",
        },
      },
      {
        titulo: {
          contains: normalized,
          mode: "insensitive",
        },
      },
      {
        contraparte: {
          contains: normalized,
          mode: "insensitive",
        },
      },
      {
        numeroExpedienteExterno: {
          contains: normalized,
          mode: "insensitive",
        },
      },
      {
        cliente: {
          is: {
            nombresORazonSocial: {
              contains: normalized,
              mode: "insensitive",
            },
          },
        },
      },
      {
        areaPractica: {
          is: {
            nombre: {
              contains: normalized,
              mode: "insensitive",
            },
          },
        },
      },
      {
        responsable: {
          is: {
            OR: [
              {
                nombres: {
                  contains: normalized,
                  mode: "insensitive",
                },
              },
              {
                apellidos: {
                  contains: normalized,
                  mode: "insensitive",
                },
              },
            ],
          },
        },
      },
    ],
  };
}

function buildListWhere(
  auth: AuthUser,
  options?: {
    search?: string;
  },
): Prisma.ExpedienteWhereInput {
  const whereClauses: Prisma.ExpedienteWhereInput[] = [buildVisibleWhere(auth)];
  const searchWhere = buildSearchWhere(options?.search);

  if (searchWhere) {
    whereClauses.push(searchWhere);
  }

  return {
    AND: whereClauses,
  };
}

function getEstadoVista(expediente: {
  estado: EstadoExpediente;
  prioridad: Prioridad;
}): ExpedienteEstadoVista {
  if (
    expediente.estado === EstadoExpediente.CERRADO ||
    expediente.estado === EstadoExpediente.ARCHIVADO
  ) {
    return "CERRADO";
  }

  if (expediente.prioridad === Prioridad.CRITICA) {
    return "URGENTE";
  }

  if (expediente.estado === EstadoExpediente.EN_ESPERA) {
    return "PENDIENTE";
  }

  return "ACTIVO";
}

function serializeDate(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function normalizeOptionalText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toSafeNumber(value: bigint | null | undefined) {
  return value === null || value === undefined ? null : Number(value);
}

function buildStoredFileName(nombreOriginal: string) {
  const sanitized = nombreOriginal
    .normalize("NFD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);

  return `${Date.now()}-${sanitized || "documento"}`;
}

function serializeExpediente(
  expediente: ExpedienteConRelaciones,
): ExpedienteSerializable {
  const ultimaActuacion =
    expediente.actuaciones[0]?.fechaEvento ?? expediente.updatedAt;

  return {
    id: expediente.id,
    numero: expediente.codigoInterno,
    titulo: expediente.titulo,
    descripcion: expediente.descripcion ?? null,
    clienteId: expediente.clienteId,
    cliente: expediente.cliente.nombresORazonSocial,
    areaPracticaId: expediente.areaPracticaId,
    materia: expediente.areaPractica.nombre,
    responsableId: expediente.responsableId,
    abogado: `${expediente.responsable.nombres} ${expediente.responsable.apellidos}`.trim(),
    contraparte: expediente.contraparte ?? null,
    organoJudicial: expediente.organoJudicial ?? null,
    numeroExpedienteExterno: expediente.numeroExpedienteExterno ?? null,
    prioridad: expediente.prioridad,
    estadoInterno: expediente.estado,
    estadoVista: getEstadoVista(expediente),
    nivelConfidencialidad: expediente.nivelConfidencialidad,
    fechaApertura: expediente.fechaApertura.toISOString(),
    fechaCierre: serializeDate(expediente.fechaCierre),
    ultimaActuacion: serializeDate(ultimaActuacion),
    createdAt: expediente.createdAt.toISOString(),
    updatedAt: expediente.updatedAt.toISOString(),
  };
}

function serializeDocumento(
  documento:
    | ExpedienteDetalleConRelaciones["documentos"][number]
    | DocumentoConRelaciones,
): ExpedienteDocumentoSerializable {
  return {
    id: documento.id,
    nombreOriginal: documento.nombreOriginal,
    nombreAlmacenado: documento.nombreAlmacenado,
    mimeType: documento.mimeType,
    tamanoBytes: toSafeNumber(documento.tamanoBytes),
    hashSha256: documento.hashSha256 ?? null,
    version: documento.version,
    fechaDocumento: serializeDate(documento.fechaDocumento),
    estadoRevision: documento.estadoRevision,
    descripcionInterna: documento.descripcionInterna ?? null,
    esConfidencial: documento.esConfidencial,
    tipoDocumento: {
      id: documento.tipoDocumento.id,
      nombre: documento.tipoDocumento.nombre,
    },
    subidoPor: {
      id: documento.subidoPor.id,
      nombreCompleto: `${documento.subidoPor.nombres} ${documento.subidoPor.apellidos}`.trim(),
      rol: documento.subidoPor.rol.nombre,
    },
    createdAt: documento.createdAt.toISOString(),
    updatedAt: documento.updatedAt.toISOString(),
  };
}

function serializeNota(nota: NotaConRelaciones): ExpedienteNotaSerializable {
  return {
    id: nota.id,
    titulo: nota.titulo ?? null,
    tipo: nota.tipo,
    contenido: nota.contenido,
    destacado: nota.destacado,
    visibilidad: nota.visibilidad,
    autor: {
      id: nota.autor.id,
      nombreCompleto: `${nota.autor.nombres} ${nota.autor.apellidos}`.trim(),
      rol: nota.autor.rol.nombre,
    },
    createdAt: nota.createdAt.toISOString(),
    updatedAt: nota.updatedAt.toISOString(),
  };
}

function serializeExpedienteDetalle(
  expediente: ExpedienteDetalleConRelaciones,
): ExpedienteDetalleSerializable {
  const base = serializeExpediente(expediente);
  const documentos = expediente.documentos.map(serializeDocumento);
  const notas = expediente.notas.map(serializeNota);
  const documentosRevisados = documentos.filter(
    (documento) => documento.estadoRevision === EstadoRevisionDocumento.REVISADO,
  ).length;
  const documentosPorRevisar = documentos.filter(
    (documento) =>
      documento.estadoRevision === EstadoRevisionDocumento.POR_REVISAR,
  ).length;
  const documentosObservados = documentos.filter(
    (documento) => documento.estadoRevision === EstadoRevisionDocumento.OBSERVADO,
  ).length;

  return {
    expediente: {
      ...base,
      resumenEjecutivo: expediente.resumenEjecutivo ?? null,
      siguientePaso: expediente.siguientePaso ?? null,
    },
    documentos,
    notas,
    actuaciones: expediente.actuaciones.map((actuacion) => ({
      id: actuacion.id,
      tipo: actuacion.tipo,
      fechaEvento: actuacion.fechaEvento.toISOString(),
      descripcion: actuacion.descripcion,
      resultado: actuacion.resultado ?? null,
      proximaAccion: actuacion.proximaAccion ?? null,
      usuario: {
        id: actuacion.usuario.id,
        nombreCompleto: `${actuacion.usuario.nombres} ${actuacion.usuario.apellidos}`.trim(),
        rol: actuacion.usuario.rol.nombre,
      },
    })),
    participantes: expediente.usuarios.map((participacion) => ({
      id: participacion.id,
      recibeAlertas: participacion.recibeAlertas,
      rolEnExpediente: participacion.rolEnExpediente,
      usuario: {
        id: participacion.usuario.id,
        nombreCompleto: `${participacion.usuario.nombres} ${participacion.usuario.apellidos}`.trim(),
        rol: participacion.usuario.rol.nombre,
        email: participacion.usuario.email,
      },
    })),
    avisos: expediente.avisos.map((aviso) => ({
      id: aviso.id,
      titulo: aviso.titulo,
      descripcion: aviso.descripcion ?? null,
      fechaVencimiento: aviso.fechaVencimiento.toISOString(),
      prioridad: aviso.prioridad,
      asignadoA: {
        id: aviso.asignadoA.id,
        nombreCompleto: `${aviso.asignadoA.nombres} ${aviso.asignadoA.apellidos}`.trim(),
      },
    })),
    metricas: {
      documentosTotales: documentos.length,
      documentosRevisados,
      documentosPorRevisar,
      documentosObservados,
      notasTotales: notas.length,
      actuacionesTotales: expediente.actuaciones.length,
    },
  };
}

function getAuditPayload(metadata: RequestMetadata) {
  return {
    ip: metadata.ip,
    userAgent: metadata.userAgent,
  };
}

async function assertRelationsForCreate(input: CreateExpedienteInput) {
  const [cliente, areaPractica, responsable] = await prisma.$transaction([
    prisma.cliente.findFirst({
      where: {
        id: input.clienteId,
        deletedAt: null,
        estado: "ACTIVO",
      },
    }),
    prisma.areaPractica.findFirst({
      where: {
        id: input.areaPracticaId,
        activa: true,
      },
    }),
    prisma.usuario.findFirst({
      where: {
        id: input.responsableId,
        deletedAt: null,
        estado: EstadoUsuario.ACTIVO,
      },
      include: {
        rol: true,
      },
    }),
  ]);

  if (!cliente) {
    throw new AppError(404, "El cliente seleccionado no existe o no esta activo.", {
      code: "CLIENTE_NOT_FOUND",
    });
  }

  if (!areaPractica) {
    throw new AppError(404, "El area de practica seleccionada no existe.", {
      code: "AREA_PRACTICA_NOT_FOUND",
    });
  }

  if (!responsable) {
    throw new AppError(
      404,
      "El responsable seleccionado no existe o no esta activo.",
      {
        code: "RESPONSABLE_NOT_FOUND",
      },
    );
  }

  return {
    cliente,
    areaPractica,
    responsable,
  };
}

async function assertTipoDocumentoActivo(tipoDocumentoId: string) {
  const tipoDocumento = await prisma.tipoDocumento.findFirst({
    where: {
      id: tipoDocumentoId,
      activo: true,
    },
  });

  if (!tipoDocumento) {
    throw new AppError(404, "El tipo de documento seleccionado no existe.", {
      code: "TIPO_DOCUMENTO_NOT_FOUND",
    });
  }

  return tipoDocumento;
}

async function getExpedienteOrThrow(expedienteId: string, auth: AuthUser) {
  const expediente = await prisma.expediente.findFirst({
    where: {
      id: expedienteId,
      AND: [buildVisibleWhere(auth)],
    },
    include: expedienteInclude,
  });

  if (!expediente) {
    throw new AppError(404, "No encontramos el expediente solicitado.", {
      code: "EXPEDIENTE_NOT_FOUND",
    });
  }

  return expediente;
}

async function getExpedienteDetalleOrThrow(expedienteId: string, auth: AuthUser) {
  const expediente = await prisma.expediente.findFirst({
    where: {
      id: expedienteId,
      AND: [buildVisibleWhere(auth)],
    },
    include: expedienteDetailInclude,
  });

  if (!expediente) {
    throw new AppError(404, "No encontramos el expediente solicitado.", {
      code: "EXPEDIENTE_NOT_FOUND",
    });
  }

  return expediente;
}

async function getDocumentoOrThrow(
  expedienteId: string,
  documentoId: string,
  auth: AuthUser,
) {
  const documento = await prisma.documento.findFirst({
    where: {
      id: documentoId,
      expedienteId,
      deletedAt: null,
      expediente: {
        is: buildVisibleWhere(auth),
      },
    },
    include: {
      tipoDocumento: true,
      subidoPor: {
        include: {
          rol: true,
        },
      },
      expediente: {
        include: expedienteInclude,
      },
    },
  });

  if (!documento) {
    throw new AppError(404, "No encontramos el documento solicitado.", {
      code: "DOCUMENTO_NOT_FOUND",
    });
  }

  return documento;
}

export async function listExpedientes(
  auth: AuthUser,
  options?: {
    search?: string;
    limit?: number;
  },
): Promise<ListExpedientesResult> {
  const limit = Math.min(Math.max(options?.limit ?? 25, 1), 100);
  const where = buildListWhere(auth, options);

  const [total, activos, pendientes, urgentes, cerrados, items] =
    await prisma.$transaction([
      prisma.expediente.count({ where }),
      prisma.expediente.count({
        where: {
          AND: [
            where,
            {
              estado: {
                in: [EstadoExpediente.ABIERTO, EstadoExpediente.EN_PROCESO],
              },
            },
          ],
        },
      }),
      prisma.expediente.count({
        where: {
          AND: [where, { estado: EstadoExpediente.EN_ESPERA }],
        },
      }),
      prisma.expediente.count({
        where: {
          AND: [
            where,
            {
              estado: {
                notIn: [EstadoExpediente.CERRADO, EstadoExpediente.ARCHIVADO],
              },
            },
            {
              prioridad: Prioridad.CRITICA,
            },
          ],
        },
      }),
      prisma.expediente.count({
        where: {
          AND: [
            where,
            {
              estado: {
                in: [EstadoExpediente.CERRADO, EstadoExpediente.ARCHIVADO],
              },
            },
          ],
        },
      }),
      prisma.expediente.findMany({
        where,
        include: expedienteInclude,
        orderBy: [{ updatedAt: "desc" }, { fechaApertura: "desc" }],
        take: limit,
      }),
    ]);

  return {
    items: items.map(serializeExpediente),
    summary: {
      total,
      activos,
      pendientes,
      urgentes,
      cerrados,
    },
  };
}

export async function getExpedienteCatalogos(
  auth: AuthUser,
): Promise<CatalogoExpedientesResult> {
  const responsablesWhere: Prisma.UsuarioWhereInput = canAccessAllExpedientes(auth)
    ? {
        deletedAt: null,
        estado: EstadoUsuario.ACTIVO,
        rol: {
          nombre: {
            in: ["ADMIN", "SOCIO", "ABOGADO"],
          },
        },
      }
    : {
        id: auth.id,
        deletedAt: null,
        estado: EstadoUsuario.ACTIVO,
      };

  const [clientes, areasPractica, responsables, tiposDocumento] =
    await prisma.$transaction([
      prisma.cliente.findMany({
        where: {
          deletedAt: null,
          estado: "ACTIVO",
        },
        select: {
          id: true,
          nombresORazonSocial: true,
          tipoPersona: true,
        },
        orderBy: {
          nombresORazonSocial: "asc",
        },
      }),
      prisma.areaPractica.findMany({
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
      }),
      prisma.usuario.findMany({
        where: responsablesWhere,
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
        orderBy: [{ nombres: "asc" }, { apellidos: "asc" }],
      }),
      prisma.tipoDocumento.findMany({
        where: {
          activo: true,
        },
        select: {
          id: true,
          nombre: true,
        },
        orderBy: {
          nombre: "asc",
        },
      }),
    ]);

  return {
    clientes: clientes.map((cliente) => ({
      id: cliente.id,
      nombre: cliente.nombresORazonSocial,
      tipoPersona: cliente.tipoPersona,
    })),
    areasPractica,
    responsables: responsables.map((responsable) => ({
      id: responsable.id,
      nombreCompleto: `${responsable.nombres} ${responsable.apellidos}`.trim(),
      rol: responsable.rol.nombre,
    })),
    tiposDocumento,
    opciones: {
      estados: Object.values(EstadoExpediente),
      prioridades: Object.values(Prioridad),
      nivelesConfidencialidad: Object.values(NivelConfidencialidad),
      estadosRevisionDocumento: Object.values(EstadoRevisionDocumento),
      tiposNota: Object.values(TipoNotaExpediente),
      visibilidadesNota: Object.values(VisibilidadNota),
    },
  };
}

export async function getExpedienteById(expedienteId: string, auth: AuthUser) {
  const expediente = await getExpedienteOrThrow(expedienteId, auth);

  return serializeExpediente(expediente);
}

export async function getExpedienteDetalleById(
  expedienteId: string,
  auth: AuthUser,
) {
  const expediente = await getExpedienteDetalleOrThrow(expedienteId, auth);

  return serializeExpedienteDetalle(expediente);
}

export async function createExpediente(
  input: CreateExpedienteInput,
  auth: AuthUser,
  metadata: RequestMetadata,
) {
  if (!canAccessAllOperationalData(auth) && input.responsableId !== auth.id) {
    throw new AppError(
      403,
      "Solo puedes crear expedientes bajo tu propia responsabilidad o con acceso administrativo.",
      {
        code: "RESPONSABLE_SCOPE_FORBIDDEN",
      },
    );
  }

  const duplicated = await prisma.expediente.findUnique({
    where: {
      codigoInterno: input.codigoInterno,
    },
    select: {
      id: true,
    },
  });

  if (duplicated) {
    throw new AppError(409, "Ya existe un expediente con ese codigo interno.", {
      code: "EXPEDIENTE_CODE_DUPLICATED",
    });
  }

  await assertRelationsForCreate(input);

  const created = await prisma.$transaction(async (tx) => {
    const expediente = await tx.expediente.create({
      data: {
        codigoInterno: input.codigoInterno,
        clienteId: input.clienteId,
        areaPracticaId: input.areaPracticaId,
        responsableId: input.responsableId,
        titulo: input.titulo,
        descripcion: input.descripcion ?? null,
        contraparte: input.contraparte ?? null,
        organoJudicial: input.organoJudicial ?? null,
        numeroExpedienteExterno: input.numeroExpedienteExterno ?? null,
        prioridad: input.prioridad ?? Prioridad.MEDIA,
        nivelConfidencialidad:
          input.nivelConfidencialidad ?? NivelConfidencialidad.ALTO,
        fechaApertura: input.fechaApertura ?? new Date(),
      },
      include: expedienteInclude,
    });

    await tx.expedienteUsuario.upsert({
      where: {
        expedienteId_usuarioId: {
          expedienteId: expediente.id,
          usuarioId: input.responsableId,
        },
      },
      update: {
        rolEnExpediente: RolEnExpediente.RESPONSABLE,
        recibeAlertas: true,
      },
      create: {
        expedienteId: expediente.id,
        usuarioId: input.responsableId,
        rolEnExpediente: RolEnExpediente.RESPONSABLE,
        recibeAlertas: true,
      },
    });

    if (auth.id !== input.responsableId) {
      await tx.expedienteUsuario.upsert({
        where: {
          expedienteId_usuarioId: {
            expedienteId: expediente.id,
            usuarioId: auth.id,
          },
        },
        update: {
          rolEnExpediente: RolEnExpediente.COLABORADOR,
          recibeAlertas: true,
        },
        create: {
          expedienteId: expediente.id,
          usuarioId: auth.id,
          rolEnExpediente: RolEnExpediente.COLABORADOR,
          recibeAlertas: true,
        },
      });
    }

    await tx.auditoriaEvento.create({
      data: {
        usuarioId: auth.id,
        entidad: "expedientes",
        entidadId: expediente.id,
        accion: "expedientes.create",
        detalle: {
          codigoInterno: expediente.codigoInterno,
          responsableId: expediente.responsableId,
          prioridad: expediente.prioridad,
        },
        ...getAuditPayload(metadata),
      },
    });

    return expediente;
  });

  return serializeExpediente(created);
}

export async function updateExpedienteStatus(
  expedienteId: string,
  input: UpdateExpedienteStatusInput,
  auth: AuthUser,
  metadata: RequestMetadata,
) {
  const expediente = await getExpedienteOrThrow(expedienteId, auth);

  if (expediente.estado === input.estado) {
    return serializeExpediente(expediente);
  }

  const shouldClose =
    input.estado === EstadoExpediente.CERRADO ||
    input.estado === EstadoExpediente.ARCHIVADO;

  const updated = await prisma.$transaction(async (tx) => {
    const nextExpediente = await tx.expediente.update({
      where: {
        id: expedienteId,
      },
      data: {
        estado: input.estado,
        fechaCierre: shouldClose ? new Date() : null,
      },
      include: expedienteInclude,
    });

    await tx.auditoriaEvento.create({
      data: {
        usuarioId: auth.id,
        entidad: "expedientes",
        entidadId: expedienteId,
        accion: "expedientes.update_status",
        detalle: {
          estadoAnterior: expediente.estado,
          estadoNuevo: input.estado,
        },
        ...getAuditPayload(metadata),
      },
    });

    return nextExpediente;
  });

  return serializeExpediente(updated);
}

export async function updateExpedienteWorkspace(
  expedienteId: string,
  input: UpdateExpedienteWorkspaceInput,
  auth: AuthUser,
  metadata: RequestMetadata,
) {
  await getExpedienteOrThrow(expedienteId, auth);

  await prisma.$transaction(async (tx) => {
    await tx.expediente.update({
      where: {
        id: expedienteId,
      },
      data: {
        resumenEjecutivo: normalizeOptionalText(input.resumenEjecutivo),
        siguientePaso: normalizeOptionalText(input.siguientePaso),
      },
    });

    await tx.auditoriaEvento.create({
      data: {
        usuarioId: auth.id,
        entidad: "expedientes",
        entidadId: expedienteId,
        accion: "expedientes.update_workspace",
        detalle: {
          resumenEjecutivoActualizado: input.resumenEjecutivo !== undefined,
          siguientePasoActualizado: input.siguientePaso !== undefined,
        },
        ...getAuditPayload(metadata),
      },
    });
  });

  return getExpedienteDetalleById(expedienteId, auth);
}

export async function createExpedienteNote(
  expedienteId: string,
  input: CreateExpedienteNoteInput,
  auth: AuthUser,
  metadata: RequestMetadata,
) {
  await getExpedienteOrThrow(expedienteId, auth);

  const nota = await prisma.$transaction(async (tx) => {
    const created = await tx.notaExpediente.create({
      data: {
        expedienteId,
        autorId: auth.id,
        titulo: normalizeOptionalText(input.titulo),
        tipo: input.tipo,
        contenido: input.contenido.trim(),
        destacado: input.destacado ?? false,
        visibilidad: input.visibilidad ?? VisibilidadNota.PRIVADA,
      },
      include: {
        autor: {
          include: {
            rol: true,
          },
        },
      },
    });

    await tx.auditoriaEvento.create({
      data: {
        usuarioId: auth.id,
        entidad: "notas_expediente",
        entidadId: created.id,
        accion: "expedientes.create_note",
        detalle: {
          expedienteId,
          tipo: created.tipo,
          destacado: created.destacado,
        },
        ...getAuditPayload(metadata),
      },
    });

    return created;
  });

  return serializeNota(nota);
}

export async function uploadExpedienteDocument(
  expedienteId: string,
  input: UploadExpedienteDocumentInput,
  auth: AuthUser,
  metadata: RequestMetadata,
) {
  if (!input.fileBuffer.length) {
    throw new AppError(400, "Debes adjuntar un archivo valido.", {
      code: "DOCUMENT_EMPTY",
    });
  }

  if (input.fileBuffer.length > MAX_DOCUMENT_SIZE_BYTES) {
    throw new AppError(413, "El archivo supera el limite permitido de 12 MB.", {
      code: "DOCUMENT_TOO_LARGE",
      details: {
        maxBytes: MAX_DOCUMENT_SIZE_BYTES,
      },
    });
  }

  await Promise.all([
    getExpedienteOrThrow(expedienteId, auth),
    assertTipoDocumentoActivo(input.tipoDocumentoId),
  ]);

  const hashSha256 = createHash("sha256")
    .update(input.fileBuffer)
    .digest("hex");

  const documentoId = await prisma.$transaction(async (tx) => {
    const created = await tx.documento.create({
      data: {
        expedienteId,
        tipoDocumentoId: input.tipoDocumentoId,
        subidoPorId: auth.id,
        nombreOriginal: input.nombreOriginal,
        nombreAlmacenado: buildStoredFileName(input.nombreOriginal),
        mimeType: input.mimeType,
        tamanoBytes: BigInt(input.fileBuffer.length),
        hashSha256,
        archivo: Uint8Array.from(input.fileBuffer),
        estadoRevision:
          input.estadoRevision ?? EstadoRevisionDocumento.POR_REVISAR,
        descripcionInterna: normalizeOptionalText(input.descripcionInterna),
        fechaDocumento: input.fechaDocumento ?? null,
        esConfidencial: input.esConfidencial ?? true,
      },
      include: {
        tipoDocumento: true,
        subidoPor: {
          include: {
            rol: true,
          },
        },
      },
    });

    await tx.auditoriaEvento.create({
      data: {
        usuarioId: auth.id,
        entidad: "documentos",
        entidadId: created.id,
        accion: "documentos.upload",
        detalle: {
          expedienteId,
          nombreOriginal: created.nombreOriginal,
          tamanoBytes: input.fileBuffer.length,
          estadoRevision: created.estadoRevision,
        },
        ...getAuditPayload(metadata),
      },
    });

    return created.id;
  });

  const documento = await getDocumentoOrThrow(expedienteId, documentoId, auth);

  return serializeDocumento(documento);
}

export async function updateExpedienteDocument(
  expedienteId: string,
  documentoId: string,
  input: UpdateExpedienteDocumentInput,
  auth: AuthUser,
  metadata: RequestMetadata,
) {
  const documento = await getDocumentoOrThrow(expedienteId, documentoId, auth);

  const updated = await prisma.$transaction(async (tx) => {
    const nextDocumento = await tx.documento.update({
      where: {
        id: documentoId,
      },
      data: {
        estadoRevision: input.estadoRevision ?? documento.estadoRevision,
        descripcionInterna:
          input.descripcionInterna === undefined
            ? documento.descripcionInterna
            : normalizeOptionalText(input.descripcionInterna),
      },
      include: {
        tipoDocumento: true,
        subidoPor: {
          include: {
            rol: true,
          },
        },
      },
    });

    await tx.auditoriaEvento.create({
      data: {
        usuarioId: auth.id,
        entidad: "documentos",
        entidadId: documentoId,
        accion: "documentos.update",
        detalle: {
          expedienteId,
          estadoRevisionAnterior: documento.estadoRevision,
          estadoRevisionNuevo:
            input.estadoRevision ?? documento.estadoRevision,
        },
        ...getAuditPayload(metadata),
      },
    });

    return nextDocumento;
  });

  return serializeDocumento(updated);
}

export async function getExpedienteDocumentDownload(
  expedienteId: string,
  documentoId: string,
  auth: AuthUser,
): Promise<DocumentoDescargaResult> {
  const documento = await getDocumentoOrThrow(expedienteId, documentoId, auth);

  if (!documento.archivo) {
    throw new AppError(
      404,
      "El documento solicitado no tiene contenido disponible.",
      {
        code: "DOCUMENT_CONTENT_MISSING",
      },
    );
  }

  return {
    mimeType: documento.mimeType,
    nombreArchivo: documento.nombreOriginal,
    contenido: Buffer.from(documento.archivo),
  };
}

export { MAX_DOCUMENT_SIZE_BYTES };
