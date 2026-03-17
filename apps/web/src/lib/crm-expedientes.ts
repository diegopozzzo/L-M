export type ExpedienteEstadoInterno =
  | "ABIERTO"
  | "EN_PROCESO"
  | "EN_ESPERA"
  | "CERRADO"
  | "ARCHIVADO";

export type ExpedienteEstadoVista =
  | "ACTIVO"
  | "PENDIENTE"
  | "URGENTE"
  | "CERRADO";

export type ExpedientePrioridad = "BAJA" | "MEDIA" | "ALTA" | "CRITICA";

export type ExpedienteNivelConfidencialidad =
  | "BAJO"
  | "MEDIO"
  | "ALTO"
  | "RESTRINGIDO";

export type DocumentoEstadoRevision =
  | "POR_REVISAR"
  | "REVISADO"
  | "OBSERVADO";

export type NotaExpedienteTipo =
  | "RESUMEN"
  | "CONCLUSION"
  | "AVANCE"
  | "PENDIENTE"
  | "CONTEXTO"
  | "OTRO";

export type NotaExpedienteVisibilidad = "INTERNA" | "PRIVADA";

export type ExpedienteListItem = {
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
  prioridad: ExpedientePrioridad;
  estadoInterno: ExpedienteEstadoInterno;
  estadoVista: ExpedienteEstadoVista;
  nivelConfidencialidad: ExpedienteNivelConfidencialidad;
  fechaApertura: string;
  fechaCierre: string | null;
  ultimaActuacion: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExpedienteSummary = {
  total: number;
  activos: number;
  pendientes: number;
  urgentes: number;
  cerrados: number;
};

export type ExpedienteCatalogo = {
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
    estados: ExpedienteEstadoInterno[];
    prioridades: ExpedientePrioridad[];
    nivelesConfidencialidad: ExpedienteNivelConfidencialidad[];
    estadosRevisionDocumento: DocumentoEstadoRevision[];
    tiposNota: NotaExpedienteTipo[];
    visibilidadesNota: NotaExpedienteVisibilidad[];
  };
};

export type ExpedienteCreatePayload = {
  codigoInterno: string;
  clienteId: string;
  areaPracticaId: string;
  responsableId: string;
  titulo: string;
  descripcion?: string;
  contraparte?: string;
  organoJudicial?: string;
  numeroExpedienteExterno?: string;
  prioridad?: ExpedientePrioridad;
  nivelConfidencialidad?: ExpedienteNivelConfidencialidad;
  fechaApertura?: string;
};

export type ExpedientesListEnvelope = {
  ok: boolean;
  mensaje?: string;
  codigo?: string;
  data?: {
    items: ExpedienteListItem[];
    summary: ExpedienteSummary;
  };
};

export type ExpedienteCatalogoEnvelope = {
  ok: boolean;
  mensaje?: string;
  codigo?: string;
  data?: ExpedienteCatalogo;
};

export type ExpedienteItemEnvelope = {
  ok: boolean;
  mensaje?: string;
  codigo?: string;
  data?: ExpedienteListItem;
};

export type ExpedienteDetalle = {
  expediente: ExpedienteListItem & {
    resumenEjecutivo: string | null;
    siguientePaso: string | null;
  };
  documentos: Array<{
    id: string;
    nombreOriginal: string;
    nombreAlmacenado: string;
    mimeType: string;
    tamanoBytes: number | null;
    hashSha256: string | null;
    version: number;
    fechaDocumento: string | null;
    estadoRevision: DocumentoEstadoRevision;
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
  }>;
  notas: Array<{
    id: string;
    titulo: string | null;
    tipo: NotaExpedienteTipo;
    contenido: string;
    destacado: boolean;
    visibilidad: NotaExpedienteVisibilidad;
    autor: {
      id: string;
      nombreCompleto: string;
      rol: string;
    };
    createdAt: string;
    updatedAt: string;
  }>;
  actuaciones: Array<{
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
  }>;
  participantes: Array<{
    id: string;
    recibeAlertas: boolean;
    rolEnExpediente: "RESPONSABLE" | "COLABORADOR" | "LECTOR";
    usuario: {
      id: string;
      nombreCompleto: string;
      rol: string;
      email: string;
    };
  }>;
  avisos: Array<{
    id: string;
    titulo: string;
    descripcion: string | null;
    fechaVencimiento: string;
    prioridad: ExpedientePrioridad;
    asignadoA: {
      id: string;
      nombreCompleto: string;
    };
  }>;
  metricas: {
    documentosTotales: number;
    documentosRevisados: number;
    documentosPorRevisar: number;
    documentosObservados: number;
    notasTotales: number;
    actuacionesTotales: number;
  };
};

export type ExpedienteDetalleEnvelope = {
  ok: boolean;
  mensaje?: string;
  codigo?: string;
  data?: ExpedienteDetalle;
};

export type ExpedienteWorkspacePayload = {
  resumenEjecutivo?: string;
  siguientePaso?: string;
};

export type ExpedienteNoteCreatePayload = {
  titulo?: string;
  tipo: NotaExpedienteTipo;
  contenido: string;
  destacado?: boolean;
  visibilidad?: NotaExpedienteVisibilidad;
};

export type ExpedienteDocumentUpdatePayload = {
  estadoRevision?: DocumentoEstadoRevision;
  descripcionInterna?: string;
};
