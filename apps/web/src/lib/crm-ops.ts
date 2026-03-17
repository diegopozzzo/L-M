export type ApiEnvelope<T> = {
  ok: boolean;
  mensaje?: string;
  codigo?: string;
  data?: T;
};

export type DashboardOverview = {
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

export type DashboardOverviewEnvelope = ApiEnvelope<DashboardOverview>;

export type ClienteItem = {
  id: string;
  nombre: string;
  creadoPorId: string | null;
  creadoPorNombre: string | null;
  esCompartido: boolean;
  tipoPersona: "NATURAL" | "JURIDICA";
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  origen: string;
  estado: "ACTIVO" | "INACTIVO" | "POTENCIAL" | "ARCHIVADO";
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
  items: ClienteItem[];
  summary: {
    total: number;
    activos: number;
    potenciales: number;
    archivados: number;
  };
};

export type ClienteCreatePayload = {
  tipoPersona: "NATURAL" | "JURIDICA";
  nombresORazonSocial: string;
  esCompartido?: boolean;
  tipoDocumento?: string;
  numeroDocumento?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  observaciones?: string;
};

export type ClientesListEnvelope = ApiEnvelope<ClientesListResult>;
export type ClienteItemEnvelope = ApiEnvelope<ClienteItem>;

export type LeadItem = {
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
  estado: "NUEVO" | "EN_REVISION" | "CONTACTADO" | "CONVERTIDO" | "DESCARTADO";
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
    estado: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type LeadsListResult = {
  items: LeadItem[];
  summary: {
    total: number;
    nuevos: number;
    enRevision: number;
    contactados: number;
    convertidos: number;
  };
};

export type LeadUpdatePayload = {
  estado?: LeadItem["estado"];
  asignadoAId?: string | null;
  esCompartido?: boolean;
};

export type LeadCreatePayload = {
  nombre: string;
  email: string;
  telefono?: string;
  empresa?: string;
  mensaje: string;
  areaPracticaId?: string;
  asignadoAId?: string | null;
  estado?: LeadItem["estado"];
  esCompartido?: boolean;
  origenUrl?: string;
};

export type LeadsListEnvelope = ApiEnvelope<LeadsListResult>;
export type LeadItemEnvelope = ApiEnvelope<LeadItem>;

export type DocumentRepoItem = {
  id: string;
  expedienteId: string;
  expedienteNumero: string;
  expedienteTitulo: string;
  cliente: string;
  tipoDocumento: string;
  nombreOriginal: string;
  mimeType: string;
  tamanoBytes: number | null;
  estadoRevision: "POR_REVISAR" | "REVISADO" | "OBSERVADO";
  descripcionInterna: string | null;
  fechaDocumento: string | null;
  subidoPor: string;
  updatedAt: string;
};

export type DocumentosListResult = {
  items: DocumentRepoItem[];
  summary: {
    total: number;
    porRevisar: number;
    revisados: number;
    observados: number;
  };
};

export type DocumentosListEnvelope = ApiEnvelope<DocumentosListResult>;

export type AvisoItem = {
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
  estado: "PENDIENTE" | "COMPLETADO" | "VENCIDO" | "CANCELADO";
  asignadoA: string;
  diasRestantes: number;
};

export type AvisosListResult = {
  items: AvisoItem[];
  summary: {
    total: number;
    pendientes: number;
    vencidos: number;
    estaSemana: number;
  };
};

export type AvisoUpdatePayload = {
  estado: AvisoItem["estado"];
};

export type AvisosListEnvelope = ApiEnvelope<AvisosListResult>;
export type AvisoItemEnvelope = ApiEnvelope<AvisoItem>;

export type EquipoMember = {
  id: string;
  nombreCompleto: string;
  email: string;
  telefono: string | null;
  rol: string;
  estado: string;
  ultimoAcceso: string | null;
  expedientesActivos: number;
  avisosPendientes: number;
  documentosSubidos: number;
};

export type EquipoListResult = {
  items: EquipoMember[];
  summary: {
    total: number;
    socios: number;
    abogados: number;
    asistentes: number;
  };
};

export type EquipoListEnvelope = ApiEnvelope<EquipoListResult>;

export type ContactCatalogo = {
  areasPractica: Array<{
    id: string;
    nombre: string;
    slug: string;
  }>;
};

export type ContactCatalogoEnvelope = ApiEnvelope<ContactCatalogo>;

export type PublicContactPayload = {
  nombre: string;
  email: string;
  telefono?: string;
  empresa?: string;
  mensaje: string;
  areaPracticaId?: string;
  origenUrl?: string;
};

