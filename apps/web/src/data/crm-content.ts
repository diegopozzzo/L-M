import type { LucideIcon } from "lucide-react";
import {
  BellRing,
  CircleAlert,
  FileArchive,
  FileText,
  FolderKanban,
  LayoutGrid,
  Scale,
  Settings2,
  Users,
} from "lucide-react";

export type CrmViewId =
  | "dashboard"
  | "expedientes"
  | "clientes"
  | "documentos"
  | "avisos"
  | "equipo"
  | "configuracion";

export type CrmMetricTone = "blue" | "green" | "red" | "gold";
export type CrmDataTone = "blue" | "green" | "amber" | "red" | "gold" | "slate";
export type CrmStatus = "ACTIVO" | "PENDIENTE" | "URGENTE" | "CERRADO";

type CrmNavItem = {
  id: CrmViewId;
  label: string;
  icono: LucideIcon;
  badge?: string;
};

type CrmMetric = {
  etiqueta: string;
  valor: string;
  cambio: string;
  tono: CrmMetricTone;
  icono: LucideIcon;
};

type CrmExpediente = {
  numero: string;
  cliente: string;
  materia: string;
  abogado: string;
  ultimaActuacion: string;
  estado: CrmStatus;
};

type CrmDeadline = {
  titulo: string;
  expediente: string;
  dias: number;
  tono: CrmDataTone;
};

type CrmActivityItem = {
  texto: string;
  momento: string;
  tono: CrmDataTone;
};

type CrmArea = {
  nombre: string;
  porcentaje: number;
  tono: Exclude<CrmDataTone, "slate">;
};

type CrmLawyer = {
  nombre: string;
  iniciales: string;
  carga: number;
  capacidad: number;
  tono: Exclude<CrmDataTone, "slate">;
};

export const crmSections: Array<{
  titulo: string;
  items: CrmNavItem[];
}> = [
  {
    titulo: "Principal",
    items: [
      { id: "dashboard", label: "Dashboard", icono: LayoutGrid },
      { id: "expedientes", label: "Expedientes", icono: FolderKanban, badge: "24" },
      { id: "clientes", label: "Clientes", icono: Users },
      { id: "documentos", label: "Documentos", icono: FileText },
    ],
  },
  {
    titulo: "Gestion",
    items: [
      { id: "avisos", label: "Avisos", icono: BellRing, badge: "5" },
      { id: "equipo", label: "Equipo", icono: Scale },
      { id: "configuracion", label: "Configuracion", icono: Settings2 },
    ],
  },
];

export const crmPageMeta: Record<
  CrmViewId,
  {
    titulo: string;
    subtitulo: string;
  }
> = {
  dashboard: {
    titulo: "Resumen general",
    subtitulo: "Lunes, 16 de marzo de 2026 - Bienvenido, Dr. Ramirez",
  },
  expedientes: {
    titulo: "Expedientes",
    subtitulo: "Gestion de casos activos y trazabilidad del despacho",
  },
  clientes: {
    titulo: "Clientes",
    subtitulo: "Directorio legal, relaciones y cartera activa",
  },
  documentos: {
    titulo: "Documentos",
    subtitulo: "Repositorio documental y control de versiones",
  },
  avisos: {
    titulo: "Avisos y vencimientos",
    subtitulo: "Alertas procesales y recordatorios internos",
  },
  equipo: {
    titulo: "Equipo juridico",
    subtitulo: "Roles, carga operativa y coordinacion del estudio",
  },
  configuracion: {
    titulo: "Configuracion",
    subtitulo: "Preferencias del sistema, perfiles e integraciones",
  },
};

export const crmMetrics: CrmMetric[] = [
  {
    etiqueta: "Expedientes activos",
    valor: "24",
    cambio: "+3 expedientes este mes",
    tono: "blue",
    icono: FolderKanban,
  },
  {
    etiqueta: "Clientes activos",
    valor: "18",
    cambio: "+2 nuevos clientes",
    tono: "green",
    icono: Users,
  },
  {
    etiqueta: "Vencimientos proximos",
    valor: "5",
    cambio: "3 vencen esta semana",
    tono: "red",
    icono: CircleAlert,
  },
  {
    etiqueta: "Documentos archivados",
    valor: "147",
    cambio: "+12 documentos esta semana",
    tono: "gold",
    icono: FileArchive,
  },
];

export const crmExpedientes: CrmExpediente[] = [
  {
    numero: "EXP-2024-089",
    cliente: "Familia Morales Quispe",
    materia: "Civil / Sucesion",
    abogado: "Dr. Ramirez",
    ultimaActuacion: "12 mar 2026",
    estado: "ACTIVO",
  },
  {
    numero: "EXP-2024-091",
    cliente: "Compania Global S.A.",
    materia: "Mercantil",
    abogado: "Dra. Torres",
    ultimaActuacion: "14 mar 2026",
    estado: "PENDIENTE",
  },
  {
    numero: "EXP-2024-095",
    cliente: "Jose Huanca Rios",
    materia: "Laboral",
    abogado: "Dr. Salas",
    ultimaActuacion: "10 mar 2026",
    estado: "ACTIVO",
  },
  {
    numero: "EXP-2024-102",
    cliente: "Inmobiliaria del Centro",
    materia: "Inmobiliario",
    abogado: "Dra. Torres",
    ultimaActuacion: "15 mar 2026",
    estado: "URGENTE",
  },
  {
    numero: "EXP-2024-108",
    cliente: "Corporacion Andina S.A.C.",
    materia: "Corporativo",
    abogado: "Dr. Ramirez",
    ultimaActuacion: "08 mar 2026",
    estado: "CERRADO",
  },
  {
    numero: "EXP-2024-115",
    cliente: "Roberto Villalobos",
    materia: "Penal",
    abogado: "Dr. Salas",
    ultimaActuacion: "16 mar 2026",
    estado: "ACTIVO",
  },
];

export const crmDeadlines: CrmDeadline[] = [
  {
    titulo: "Audiencia preliminar",
    expediente: "EXP-2024-102 - Inmobiliaria del Centro",
    dias: 2,
    tono: "red",
  },
  {
    titulo: "Contestacion de demanda",
    expediente: "EXP-2024-095 - Jose Huanca Rios",
    dias: 5,
    tono: "red",
  },
  {
    titulo: "Presentar pruebas",
    expediente: "EXP-2024-089 - Familia Morales",
    dias: 11,
    tono: "amber",
  },
  {
    titulo: "Renovar poder notarial",
    expediente: "EXP-2024-091 - Compania Global",
    dias: 18,
    tono: "amber",
  },
  {
    titulo: "Vista oral programada",
    expediente: "EXP-2024-108 - Corporacion Andina",
    dias: 30,
    tono: "green",
  },
];

export const crmActivity: CrmActivityItem[] = [
  {
    texto: "Dra. Torres subio 3 documentos al expediente EXP-2024-102",
    momento: "hace 15 min",
    tono: "blue",
  },
  {
    texto: "Nuevo cliente registrado: Corporacion Andina S.A.C.",
    momento: "hace 1 hora",
    tono: "green",
  },
  {
    texto: "Dr. Salas cambio el estado de EXP-2024-095 a Activo",
    momento: "hace 2 horas",
    tono: "amber",
  },
  {
    texto: "Aviso automatico: vencimiento en 2 dias - EXP-2024-102",
    momento: "hace 3 horas",
    tono: "red",
  },
  {
    texto: "Dr. Ramirez cerro el expediente EXP-2024-108 - Corporacion Andina",
    momento: "hace 5 horas",
    tono: "slate",
  },
];

export const crmAreas: CrmArea[] = [
  { nombre: "Derecho Civil", porcentaje: 35, tono: "blue" },
  { nombre: "Derecho Laboral", porcentaje: 25, tono: "green" },
  { nombre: "Derecho Mercantil", porcentaje: 20, tono: "amber" },
  { nombre: "Inmobiliario", porcentaje: 12, tono: "red" },
  { nombre: "Corporativo", porcentaje: 8, tono: "gold" },
];

export const crmLawyers: CrmLawyer[] = [
  { nombre: "Dr. Ramirez", iniciales: "DR", carga: 9, capacidad: 15, tono: "blue" },
  { nombre: "Dra. Torres", iniciales: "DT", carga: 8, capacidad: 15, tono: "green" },
  { nombre: "Dr. Salas", iniciales: "DS", carga: 5, capacidad: 15, tono: "amber" },
  { nombre: "Dra. Quispe", iniciales: "DQ", carga: 2, capacidad: 15, tono: "gold" },
];

export const crmPlaceholders: Record<
  Exclude<CrmViewId, "dashboard">,
  {
    titulo: string;
    descripcion: string;
    fase: string;
    icono: LucideIcon;
  }
> = {
  expedientes: {
    titulo: "Modulo de Expedientes",
    descripcion:
      "Vista completa con filtros, busqueda avanzada, timeline de actuaciones y CRUD seguro por roles.",
    fase: "Siguiente paso natural despues de autenticacion",
    icono: FolderKanban,
  },
  clientes: {
    titulo: "Modulo de Clientes",
    descripcion:
      "Directorio, perfil integral, contactos relacionados y vinculacion con expedientes activos.",
    fase: "Fase posterior al backend base",
    icono: Users,
  },
  documentos: {
    titulo: "Repositorio de Documentos",
    descripcion:
      "Carga, versionado, metadata y preparacion para integracion con AWS S3.",
    fase: "Fase documental",
    icono: FileText,
  },
  avisos: {
    titulo: "Sistema de Avisos",
    descripcion:
      "Alertas procesales, recordatorios internos y seguimiento de vencimientos con prioridad.",
    fase: "Fase de automatizacion operativa",
    icono: BellRing,
  },
  equipo: {
    titulo: "Gestion de Equipo",
    descripcion:
      "Asignacion de roles, distribucion de carga y control de permisos por perfil profesional.",
    fase: "Se conectara a JWT, Bcrypt y roles",
    icono: Scale,
  },
  configuracion: {
    titulo: "Configuracion",
    descripcion:
      "Parametros del estudio, catalogos maestros, integraciones y preferencias del sistema.",
    fase: "Fase administrativa",
    icono: Settings2,
  },
};

