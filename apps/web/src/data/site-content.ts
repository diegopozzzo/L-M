import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  BookOpenText,
  BriefcaseBusiness,
  Building2,
  Clock3,
  FileSearch,
  Files,
  Globe2,
  Handshake,
  Landmark,
  Mail,
  MapPin,
  Phone,
  Scale,
  ShieldCheck,
  Users2,
} from "lucide-react";

export type SiteSectionId =
  | "inicio"
  | "firma"
  | "areas"
  | "equipo"
  | "contacto";

export type SiteHref = `/#${SiteSectionId}`;

export type NavItem = {
  href: SiteHref;
  sectionId: SiteSectionId;
  label: string;
};

export type ContentCard = {
  titulo: string;
  descripcion: string;
  icono: LucideIcon;
};

export const siteNavigation: NavItem[] = [
  { href: "/#inicio", sectionId: "inicio", label: "Inicio" },
  { href: "/#firma", sectionId: "firma", label: "Quienes Somos" },
  { href: "/#areas", sectionId: "areas", label: "Areas de Practica" },
  { href: "/#equipo", sectionId: "equipo", label: "Equipo" },
  { href: "/#contacto", sectionId: "contacto", label: "Contacto" },
];

export const heroMetrics = [
  { valor: "25+", etiqueta: "anos de criterio combinado" },
  { valor: "140", etiqueta: "asuntos monitoreados por trimestre" },
  { valor: "4", etiqueta: "frentes operativos integrados" },
];

export const operatingHighlights = [
  {
    titulo: "Coordinacion ejecutiva",
    descripcion:
      "Unimos estrategia juridica, seguimiento fino de riesgos y comunicacion clara para directorios y gerencias.",
    icono: BriefcaseBusiness,
  },
  {
    titulo: "Control documental",
    descripcion:
      "Ordenamos contratos, antecedentes y piezas criticas con un criterio documental consistente.",
    icono: Files,
  },
  {
    titulo: "Cobertura corporativa",
    descripcion:
      "La propuesta combina prevencion, litigio y gobierno interno con una experiencia consistente para el cliente.",
    icono: ShieldCheck,
  },
];

export const practiceAreas: ContentCard[] = [
  {
    titulo: "Corporativo y societario",
    descripcion:
      "Reorganizaciones, juntas, pactos societarios, compliance y acompanamiento a alta direccion.",
    icono: Building2,
  },
  {
    titulo: "Litigios y controversias",
    descripcion:
      "Diseno de estrategia procesal, defensa integral y seguimiento ejecutivo de hitos criticos.",
    icono: Scale,
  },
  {
    titulo: "Laboral y relaciones humanas",
    descripcion:
      "Prevencion de contingencias, procesos disciplinarios y patrocinio en conflictos individuales o colectivos.",
    icono: Users2,
  },
  {
    titulo: "Contratos y riesgos",
    descripcion:
      "Arquitectura contractual, matrices de riesgo, revisiones cruzadas y resguardo de intereses clave.",
    icono: Handshake,
  },
  {
    titulo: "Inmobiliario y activos",
    descripcion:
      "Debida diligencia, saneamiento, estructuracion de operaciones y resguardo registral.",
    icono: Landmark,
  },
  {
    titulo: "Propiedad intelectual",
    descripcion:
      "Proteccion marcaria, activos intangibles y defensa de posicion competitiva.",
    icono: BadgeCheck,
  },
];

export const values: ContentCard[] = [
  {
    titulo: "Rigor analitico",
    descripcion:
      "Cada recomendacion se sostiene con criterio tecnico, lectura de contexto y trazabilidad documental.",
    icono: FileSearch,
  },
  {
    titulo: "Respuesta oportuna",
    descripcion:
      "Priorizamos tiempos de negocio y ventanas procesales sin perder profundidad juridica.",
    icono: Clock3,
  },
  {
    titulo: "Lenguaje directivo",
    descripcion:
      "Traducimos complejidad legal en decisiones claras para socios, gerencias y equipos internos.",
    icono: BookOpenText,
  },
];

export const processSteps = [
  {
    titulo: "Diagnostico",
    descripcion:
      "Levantamos antecedentes, riesgos, urgencias y mapa de actores antes de recomendar movimiento.",
  },
  {
    titulo: "Estrategia",
    descripcion:
      "Definimos la ruta legal, los responsables, los hitos y el tablero ejecutivo de seguimiento.",
  },
  {
    titulo: "Ejecucion",
    descripcion:
      "Documentamos decisiones, controlamos plazos y mantenemos visibilidad sobre cada frente activo.",
  },
];

export const teamMembers = [
  {
    nombre: "Diego Ramirez",
    cargo: "Socio principal",
    bio: "Direccion estrategica, controversias complejas y acompanamiento a comites directivos.",
  },
  {
    nombre: "Valeria Torres",
    cargo: "Socia de practica corporativa",
    bio: "Estructuras societarias, contratos clave y gobierno corporativo para empresas en expansion.",
  },
  {
    nombre: "Martin Salas",
    cargo: "Lider de litigios",
    bio: "Procesos judiciales de alta sensibilidad, recuperaciones y coordinacion probatoria.",
  },
  {
    nombre: "Lucia Quispe",
    cargo: "Coordinadora legal",
    bio: "Coordinacion documental, seguimiento de asuntos activos y articulacion entre frentes legales.",
  },
];

export const insightCards = [
  {
    titulo: "Como reducir friccion entre gerencia y asesoria legal interna",
    resumen:
      "Un marco simple para convertir consultas urgentes en flujos documentados y medibles.",
  },
  {
    titulo: "Tres capas de seguimiento para expedientes con plazos sensibles",
    resumen:
      "Vista operativa, vista ejecutiva y alertas preventivas para no depender de memoria individual.",
  },
  {
    titulo: "Documentacion legal que realmente ayuda a la toma de decisiones",
    resumen:
      "Del escrito tecnico al resumen accionable para socios, CFO y lideres comerciales.",
  },
];

export const officeCards = [
  {
    ciudad: "Lima",
    detalle: "Centro corporativo y direccion operativa principal.",
  },
  {
    ciudad: "Arequipa",
    detalle: "Cobertura descentralizada para operaciones regionales.",
  },
  {
    ciudad: "Trujillo",
    detalle: "Atencion coordinada para clientes del norte y litigios locales.",
  },
  {
    ciudad: "Atencion remota",
    detalle: "Mesas virtuales, reportes ejecutivos y seguimiento documental seguro.",
  },
];

export const contactChannels = [
  {
    titulo: "Agenda una reunion",
    detalle: "Coordinemos una sesion de diagnostico para revisar tu frente legal actual.",
    icono: Phone,
    valor: "+51 999 000 000",
  },
  {
    titulo: "Escribenos",
    detalle: "Respondemos consultas iniciales y coordinamos entrevistas de evaluacion.",
    icono: Mail,
    valor: "contacto@lexestudio.pe",
  },
  {
    titulo: "Visitanos",
    detalle: "Atencion presencial para reuniones estrategicas y revision de documentacion.",
    icono: MapPin,
    valor: "San Isidro, Lima, Peru",
  },
  {
    titulo: "Cobertura regional",
    detalle: "Equipo coordinado para clientes empresariales y asuntos multisede.",
    icono: Globe2,
    valor: "Lima, Arequipa, Trujillo",
  },
];
