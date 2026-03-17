import "dotenv/config";
import { createHash } from "node:crypto";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });
const shouldSeedDemoData =
  (process.env.SEED_DEMO_DATA ?? "false").trim().toLowerCase() === "true";

const permisosBase = [
  { clave: "usuarios.read", modulo: "usuarios", descripcion: "Ver usuarios y perfiles internos." },
  { clave: "usuarios.write", modulo: "usuarios", descripcion: "Crear y editar usuarios internos." },
  { clave: "roles.read", modulo: "seguridad", descripcion: "Consultar roles y permisos." },
  { clave: "roles.write", modulo: "seguridad", descripcion: "Gestionar permisos por rol." },
  { clave: "clientes.read", modulo: "clientes", descripcion: "Consultar clientes y contactos." },
  { clave: "clientes.write", modulo: "clientes", descripcion: "Crear y editar clientes." },
  { clave: "expedientes.read", modulo: "expedientes", descripcion: "Consultar expedientes." },
  { clave: "expedientes.write", modulo: "expedientes", descripcion: "Crear y editar expedientes." },
  { clave: "documentos.read", modulo: "documentos", descripcion: "Consultar documentos." },
  { clave: "documentos.write", modulo: "documentos", descripcion: "Subir y actualizar documentos." },
  { clave: "avisos.read", modulo: "avisos", descripcion: "Consultar alertas y vencimientos." },
  { clave: "avisos.write", modulo: "avisos", descripcion: "Crear y cerrar alertas." },
  { clave: "leads.read", modulo: "captacion", descripcion: "Consultar formularios de contacto." },
  { clave: "leads.write", modulo: "captacion", descripcion: "Gestionar conversion de leads." },
  { clave: "auditoria.read", modulo: "auditoria", descripcion: "Consultar trazabilidad del sistema." },
];

const rolesBase = [
  { nombre: "ADMIN", descripcion: "Control total sobre el ecosistema legal." },
  { nombre: "SOCIO", descripcion: "Supervision operativa y comercial del estudio." },
  { nombre: "ABOGADO", descripcion: "Gestion de expedientes, actuaciones y documentos." },
  { nombre: "ASISTENTE", descripcion: "Soporte operativo con permisos acotados." },
];

const permisosPorRol: Record<string, string[]> = {
  ADMIN: permisosBase.map((permiso) => permiso.clave),
  SOCIO: [
    "usuarios.read",
    "roles.read",
    "clientes.read",
    "clientes.write",
    "expedientes.read",
    "expedientes.write",
    "documentos.read",
    "documentos.write",
    "avisos.read",
    "avisos.write",
    "leads.read",
    "auditoria.read",
  ],
  ABOGADO: [
    "clientes.read",
    "clientes.write",
    "expedientes.read",
    "expedientes.write",
    "documentos.read",
    "documentos.write",
    "avisos.read",
    "avisos.write",
    "leads.read",
    "leads.write",
  ],
  ASISTENTE: [
    "clientes.read",
    "clientes.write",
    "expedientes.read",
    "expedientes.write",
    "documentos.read",
    "documentos.write",
    "avisos.read",
    "avisos.write",
    "leads.read",
    "leads.write",
  ],
};

const areasBase = [
  {
    nombre: "Derecho Corporativo",
    slug: "derecho-corporativo",
    descripcion: "Asesoria societaria, gobierno corporativo y contratos empresariales.",
  },
  {
    nombre: "Derecho Laboral",
    slug: "derecho-laboral",
    descripcion: "Patrocinio en relaciones laborales, compliance y contingencias.",
  },
  {
    nombre: "Litigios Civiles",
    slug: "litigios-civiles",
    descripcion: "Patrocinio judicial y estrategias procesales en materia civil.",
  },
  {
    nombre: "Derecho Penal",
    slug: "derecho-penal",
    descripcion: "Defensa penal y acompanamiento procesal en investigaciones.",
  },
  {
    nombre: "Propiedad Intelectual",
    slug: "propiedad-intelectual",
    descripcion: "Marcas, derechos de autor y proteccion de activos intangibles.",
  },
];

const tiposDocumentoBase = [
  { nombre: "Demanda", descripcion: "Escrito inicial de demanda." },
  { nombre: "Contestacion", descripcion: "Contestacion de demanda o respuesta procesal." },
  { nombre: "Contrato", descripcion: "Contrato o adenda contractual." },
  { nombre: "Poder", descripcion: "Poder de representacion o carta poder." },
  { nombre: "Resolucion", descripcion: "Resolucion, sentencia u orden administrativa." },
  { nombre: "Notificacion", descripcion: "Cedula, notificacion o cargo de recepcion." },
];

const usuariosDemoBase = [
  {
    email: "raul.ramirez@estudiolegal.local",
    nombres: "Raul",
    apellidos: "Ramirez",
    telefono: "+51 987 100 101",
    rolNombre: "SOCIO",
  },
  {
    email: "claudia.torres@estudiolegal.local",
    nombres: "Claudia",
    apellidos: "Torres",
    telefono: "+51 987 100 102",
    rolNombre: "ABOGADO",
  },
  {
    email: "martin.salas@estudiolegal.local",
    nombres: "Martin",
    apellidos: "Salas",
    telefono: "+51 987 100 103",
    rolNombre: "ABOGADO",
  },
  {
    email: "lucia.quispe@estudiolegal.local",
    nombres: "Lucia",
    apellidos: "Quispe",
    telefono: "+51 987 100 104",
    rolNombre: "ASISTENTE",
  },
  {
    email: "valeria.orellana@estudiolegal.local",
    nombres: "Valeria",
    apellidos: "Orellana",
    telefono: "+51 987 100 105",
    rolNombre: "ABOGADO",
  },
  {
    email: "diego.carrasco@estudiolegal.local",
    nombres: "Diego",
    apellidos: "Carrasco",
    telefono: "+51 987 100 106",
    rolNombre: "ABOGADO",
  },
  {
    email: "paula.vargas@estudiolegal.local",
    nombres: "Paula",
    apellidos: "Vargas",
    telefono: "+51 987 100 107",
    rolNombre: "ASISTENTE",
  },
];

const clientesDemoBase = [
  {
    numeroDocumento: "20600011111",
    creadoPorEmail: "raul.ramirez@estudiolegal.local",
    tipoPersona: "JURIDICA" as const,
    nombresORazonSocial: "Inversiones Maranga S.A.C.",
    tipoDocumento: "RUC",
    email: "legal@maranga.pe",
    telefono: "+51 1 616 1001",
    direccion: "Av. Primavera 825, San Borja",
    origen: "MANUAL" as const,
    estado: "ACTIVO" as const,
    esCompartido: true,
  },
  {
    numeroDocumento: "74221133",
    creadoPorEmail: "martin.salas@estudiolegal.local",
    tipoPersona: "NATURAL" as const,
    nombresORazonSocial: "Maria Fernanda Ruiz",
    tipoDocumento: "DNI",
    email: "maria.ruiz@correo.pe",
    telefono: "+51 987 440 221",
    direccion: "Calle Las Magnolias 230, Miraflores",
    origen: "REFERIDO" as const,
    estado: "ACTIVO" as const,
    esCompartido: false,
  },
  {
    numeroDocumento: "20600022222",
    creadoPorEmail: "claudia.torres@estudiolegal.local",
    tipoPersona: "JURIDICA" as const,
    nombresORazonSocial: "Grupo Altamar S.A.C.",
    tipoDocumento: "RUC",
    email: "compliance@altamar.pe",
    telefono: "+51 1 616 1002",
    direccion: "Jr. Los Cedros 540, San Isidro",
    origen: "MANUAL" as const,
    estado: "ACTIVO" as const,
    esCompartido: false,
  },
  {
    numeroDocumento: "20600033333",
    creadoPorEmail: "claudia.torres@estudiolegal.local",
    tipoPersona: "JURIDICA" as const,
    nombresORazonSocial: "Constructora Santa Beatriz S.A.C.",
    tipoDocumento: "RUC",
    email: "gerencia@santabeatriz.pe",
    telefono: "+51 1 616 1003",
    direccion: "Av. Petit Thouars 1540, Lima",
    origen: "WEB" as const,
    estado: "ACTIVO" as const,
    esCompartido: true,
  },
  {
    numeroDocumento: "20600044444",
    creadoPorEmail: "valeria.orellana@estudiolegal.local",
    tipoPersona: "JURIDICA" as const,
    nombresORazonSocial: "Nexo Digital S.A.C.",
    tipoDocumento: "RUC",
    email: "direccion@nexodigital.pe",
    telefono: "+51 1 616 1004",
    direccion: "Av. Benavides 410, Miraflores",
    origen: "MANUAL" as const,
    estado: "ACTIVO" as const,
    esCompartido: false,
  },
  {
    numeroDocumento: "46778899",
    creadoPorEmail: "diego.carrasco@estudiolegal.local",
    tipoPersona: "NATURAL" as const,
    nombresORazonSocial: "Rafael Ponce",
    tipoDocumento: "DNI",
    email: "rafael.ponce@correo.pe",
    telefono: "+51 987 440 889",
    direccion: "Jr. Catalino Miranda 502, Barranco",
    origen: "REFERIDO" as const,
    estado: "POTENCIAL" as const,
    esCompartido: true,
  },
];

const contactosClienteDemoBase = [
  {
    clienteDocumento: "20600011111",
    nombre: "Camila Soto",
    cargo: "Gerente legal",
    email: "camila.soto@maranga.pe",
    telefono: "+51 987 300 101",
    esPrincipal: true,
  },
  {
    clienteDocumento: "20600022222",
    nombre: "Josefina Paredes",
    cargo: "Compliance manager",
    email: "jparedes@altamar.pe",
    telefono: "+51 987 300 102",
    esPrincipal: true,
  },
  {
    clienteDocumento: "20600033333",
    nombre: "Carlos Mejia",
    cargo: "Gerente de proyectos",
    email: "carlos.mejia@santabeatriz.pe",
    telefono: "+51 987 300 103",
    esPrincipal: true,
  },
  {
    clienteDocumento: "20600044444",
    nombre: "Andrea Milla",
    cargo: "Gerente general",
    email: "andrea.milla@nexodigital.pe",
    telefono: "+51 987 300 104",
    esPrincipal: true,
  },
];

const expedientesDemoBase = [
  {
    codigoInterno: "EXP-2026-001",
    clienteDocumento: "20600011111",
    areaSlug: "derecho-corporativo",
    responsableEmail: "raul.ramirez@estudiolegal.local",
    colaboradorEmail: "lucia.quispe@estudiolegal.local",
    titulo: "Reestructuracion societaria y actas corporativas",
    descripcion:
      "Acompanamiento integral para la reorganizacion interna, actualizacion de poderes y juntas.",
    contraparte: "Superintendencia Nacional de Registros Publicos",
    organoJudicial: "Gestion registral y societaria",
    numeroExpedienteExterno: "REG-2026-015",
    estado: "EN_PROCESO" as const,
    prioridad: "ALTA" as const,
    fechaApertura: new Date("2026-01-12T10:00:00.000Z"),
    actuacionFecha: new Date("2026-03-10T15:00:00.000Z"),
    actuacionDescripcion: "Revision final de actas y coordinacion de firma.",
  },
  {
    codigoInterno: "EXP-2026-002",
    clienteDocumento: "74221133",
    areaSlug: "derecho-laboral",
    responsableEmail: "martin.salas@estudiolegal.local",
    colaboradorEmail: "lucia.quispe@estudiolegal.local",
    titulo: "Patrocinio en impugnacion de despido",
    descripcion:
      "Seguimiento de demanda laboral, recopilacion de pruebas y coordinacion de audiencia.",
    contraparte: "Corporacion Textil Lima S.A.",
    organoJudicial: "Juzgado Laboral de Lima",
    numeroExpedienteExterno: "LAB-2026-082",
    estado: "EN_ESPERA" as const,
    prioridad: "MEDIA" as const,
    fechaApertura: new Date("2026-02-03T09:30:00.000Z"),
    actuacionFecha: new Date("2026-03-04T18:15:00.000Z"),
    actuacionDescripcion: "Presentacion de anexos y control de notificacion.",
  },
  {
    codigoInterno: "EXP-2026-003",
    clienteDocumento: "20600022222",
    areaSlug: "litigios-civiles",
    responsableEmail: "claudia.torres@estudiolegal.local",
    colaboradorEmail: "raul.ramirez@estudiolegal.local",
    titulo: "Cobro judicial de obligaciones comerciales",
    descripcion:
      "Estrategia procesal para recuperacion de acreencias y negociacion extrajudicial paralela.",
    contraparte: "Servicios Portuarios del Pacifico S.A.C.",
    organoJudicial: "Sala Civil Comercial",
    numeroExpedienteExterno: "CIV-2026-140",
    estado: "ABIERTO" as const,
    prioridad: "CRITICA" as const,
    fechaApertura: new Date("2026-03-01T08:45:00.000Z"),
    actuacionFecha: new Date("2026-03-14T13:20:00.000Z"),
    actuacionDescripcion: "Ingreso de escrito cautelar y revision de cargo.",
  },
  {
    codigoInterno: "EXP-2026-004",
    clienteDocumento: "20600033333",
    areaSlug: "litigios-civiles",
    responsableEmail: "claudia.torres@estudiolegal.local",
    colaboradorEmail: "martin.salas@estudiolegal.local",
    titulo: "Controversia contractual por ampliacion de obra",
    descripcion:
      "Analisis de incumplimientos, valorizaciones y reclamos derivados de contrato de ejecucion.",
    contraparte: "Consorcio Vias Metropolitanas",
    organoJudicial: "Centro de Arbitraje Comercial",
    numeroExpedienteExterno: "ARB-2026-021",
    estado: "CERRADO" as const,
    prioridad: "ALTA" as const,
    fechaApertura: new Date("2025-11-20T16:00:00.000Z"),
    actuacionFecha: new Date("2026-02-28T11:10:00.000Z"),
    actuacionDescripcion: "Cierre de carpeta y registro de acuerdo transaccional.",
  },
  {
    codigoInterno: "EXP-2026-005",
    clienteDocumento: "20600044444",
    areaSlug: "propiedad-intelectual",
    responsableEmail: "valeria.orellana@estudiolegal.local",
    colaboradorEmail: "paula.vargas@estudiolegal.local",
    titulo: "Registro y defensa de portafolio marcario",
    descripcion:
      "Revision de clases registrales, oposiciones potenciales y estrategia de vigilancia de marca.",
    contraparte: "Terceros opositores eventuales",
    organoJudicial: "Indecopi",
    numeroExpedienteExterno: "PI-2026-018",
    estado: "ABIERTO" as const,
    prioridad: "ALTA" as const,
    fechaApertura: new Date("2026-02-18T11:30:00.000Z"),
    actuacionFecha: new Date("2026-03-13T14:10:00.000Z"),
    actuacionDescripcion: "Presentacion de observaciones y confirmacion de vigilancia mensual.",
  },
  {
    codigoInterno: "EXP-2026-006",
    clienteDocumento: "46778899",
    areaSlug: "derecho-penal",
    responsableEmail: "diego.carrasco@estudiolegal.local",
    colaboradorEmail: "raul.ramirez@estudiolegal.local",
    titulo: "Asistencia en investigacion penal empresarial",
    descripcion:
      "Diseno de estrategia defensiva temprana, revision documental y atencion de diligencias.",
    contraparte: "Ministerio Publico",
    organoJudicial: "Fiscalia corporativa especializada",
    numeroExpedienteExterno: "PEN-2026-041",
    estado: "EN_PROCESO" as const,
    prioridad: "CRITICA" as const,
    fechaApertura: new Date("2026-02-25T09:15:00.000Z"),
    actuacionFecha: new Date("2026-03-15T16:40:00.000Z"),
    actuacionDescripcion: "Preparacion de comparecencia y consolidacion de soporte probatorio.",
  },
];

const avisosDemoBase = [
  {
    expedienteCodigo: "EXP-2026-001",
    asignadoEmail: "raul.ramirez@estudiolegal.local",
    titulo: "Firma final de actas societarias",
    descripcion: "Confirmar firma y cierre registral antes del vencimiento operativo.",
    tipoAviso: "RECORDATORIO" as const,
    fechaRecordatorio: new Date("2026-03-18T09:00:00.000Z"),
    fechaVencimiento: new Date("2026-03-20T17:00:00.000Z"),
    prioridad: "ALTA" as const,
  },
  {
    expedienteCodigo: "EXP-2026-002",
    asignadoEmail: "martin.salas@estudiolegal.local",
    titulo: "Control de audiencia laboral",
    descripcion: "Revisar anexos y confirmar estrategia para audiencia de la siguiente semana.",
    tipoAviso: "AUDIENCIA" as const,
    fechaRecordatorio: new Date("2026-03-17T08:00:00.000Z"),
    fechaVencimiento: new Date("2026-03-19T10:00:00.000Z"),
    prioridad: "MEDIA" as const,
  },
  {
    expedienteCodigo: "EXP-2026-003",
    asignadoEmail: "claudia.torres@estudiolegal.local",
    titulo: "Presentar escrito cautelar",
    descripcion: "Ultima revision del escrito y adjuntos de sustento.",
    tipoAviso: "VENCIMIENTO" as const,
    fechaRecordatorio: new Date("2026-03-16T08:00:00.000Z"),
    fechaVencimiento: new Date("2026-03-18T16:00:00.000Z"),
    prioridad: "CRITICA" as const,
  },
  {
    expedienteCodigo: "EXP-2026-005",
    asignadoEmail: "valeria.orellana@estudiolegal.local",
    titulo: "Responder observacion de marca",
    descripcion: "Revisar clase observada y enviar subsanacion dentro del plazo.",
    tipoAviso: "VENCIMIENTO" as const,
    fechaRecordatorio: new Date("2026-03-18T09:30:00.000Z"),
    fechaVencimiento: new Date("2026-03-21T15:00:00.000Z"),
    prioridad: "ALTA" as const,
  },
  {
    expedienteCodigo: "EXP-2026-006",
    asignadoEmail: "diego.carrasco@estudiolegal.local",
    titulo: "Diligencia fiscal programada",
    descripcion: "Confirmar carpeta, version de hechos y agenda del cliente.",
    tipoAviso: "AUDIENCIA" as const,
    fechaRecordatorio: new Date("2026-03-17T12:00:00.000Z"),
    fechaVencimiento: new Date("2026-03-19T09:00:00.000Z"),
    prioridad: "CRITICA" as const,
  },
];

const leadsDemoBase = [
  {
    creadoPorEmail: "raul.ramirez@estudiolegal.local",
    asignadoEmail: "raul.ramirez@estudiolegal.local",
    nombre: "Mariana Velasquez",
    email: "mariana.velasquez@orbe.pe",
    telefono: "+51 999 100 201",
    empresa: "Corporacion Orbe S.A.C.",
    mensaje: "Necesitamos una revision urgente de contratos de distribucion y contingencias con proveedores.",
    areaSlug: "derecho-corporativo",
    estado: "NUEVO" as const,
    esCompartido: true,
  },
  {
    creadoPorEmail: "martin.salas@estudiolegal.local",
    asignadoEmail: "martin.salas@estudiolegal.local",
    nombre: "Luis Gamarra",
    email: "luis.gamarra@correo.pe",
    telefono: "+51 999 100 202",
    empresa: null,
    mensaje: "Busco patrocinio para una controversia laboral y revision de antecedentes.",
    areaSlug: "derecho-laboral",
    estado: "EN_REVISION" as const,
    esCompartido: false,
  },
  {
    creadoPorEmail: "claudia.torres@estudiolegal.local",
    asignadoEmail: "claudia.torres@estudiolegal.local",
    nombre: "Ana Lazo",
    email: "ana.lazo@constructora-norte.pe",
    telefono: "+51 999 100 203",
    empresa: "Constructora Norte S.A.C.",
    mensaje: "Queremos coordinar una reunion para evaluar un arbitraje por ampliacion de obra.",
    areaSlug: "litigios-civiles",
    estado: "CONTACTADO" as const,
    esCompartido: false,
  },
  {
    creadoPorEmail: "valeria.orellana@estudiolegal.local",
    asignadoEmail: "valeria.orellana@estudiolegal.local",
    nombre: "Katherine Cueva",
    email: "kcueva@visioncreative.pe",
    telefono: "+51 999 100 204",
    empresa: "Vision Creative Lab S.A.C.",
    mensaje: "Requerimos proteccion de marca y revision de observaciones de Indecopi.",
    areaSlug: "propiedad-intelectual",
    estado: "NUEVO" as const,
    esCompartido: false,
  },
  {
    creadoPorEmail: "diego.carrasco@estudiolegal.local",
    asignadoEmail: "diego.carrasco@estudiolegal.local",
    nombre: "Rocio Almonte",
    email: "rocio.almonte@correo.pe",
    telefono: "+51 999 100 205",
    empresa: null,
    mensaje: "Necesito asesoria por una citacion fiscal y revision de documentacion de defensa.",
    areaSlug: "derecho-penal",
    estado: "EN_REVISION" as const,
    esCompartido: true,
  },
];

async function seedPermisosYRoles() {
  for (const permiso of permisosBase) {
    await prisma.permiso.upsert({
      where: { clave: permiso.clave },
      update: permiso,
      create: permiso,
    });
  }

  for (const rol of rolesBase) {
    await prisma.rol.upsert({
      where: { nombre: rol.nombre },
      update: rol,
      create: rol,
    });
  }

  const permisos = await prisma.permiso.findMany();
  const permisosIndexados = new Map(permisos.map((permiso) => [permiso.clave, permiso.id]));

  for (const rol of rolesBase) {
    const rolPersistido = await prisma.rol.findUniqueOrThrow({
      where: { nombre: rol.nombre },
    });

    await prisma.rolPermiso.deleteMany({
      where: { rolId: rolPersistido.id },
    });

    await prisma.rolPermiso.createMany({
      data: permisosPorRol[rol.nombre].map((clave) => ({
        rolId: rolPersistido.id,
        permisoId: permisosIndexados.get(clave)!,
      })),
      skipDuplicates: true,
    });
  }
}

async function seedCatalogos() {
  for (const area of areasBase) {
    await prisma.areaPractica.upsert({
      where: { slug: area.slug },
      update: area,
      create: area,
    });
  }

  for (const tipo of tiposDocumentoBase) {
    await prisma.tipoDocumento.upsert({
      where: { nombre: tipo.nombre },
      update: tipo,
      create: tipo,
    });
  }
}

async function buildSeedPasswordHash() {
  const passwordPlano = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";

  return bcrypt.hash(passwordPlano, 10);
}

async function seedAdmin(passwordHash: string) {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@estudiolegal.local";

  const rolAdmin = await prisma.rol.findUniqueOrThrow({
    where: { nombre: "ADMIN" },
  });

  await prisma.usuario.upsert({
    where: { email },
    update: {
      nombres: "Administrador",
      apellidos: "Principal",
      passwordHash,
      rolId: rolAdmin.id,
      estado: "ACTIVO",
    },
    create: {
      nombres: "Administrador",
      apellidos: "Principal",
      email,
      passwordHash,
      rolId: rolAdmin.id,
      estado: "ACTIVO",
    },
  });
}

async function seedEquipoDemo(passwordHash: string) {
  const roles = await prisma.rol.findMany({
    where: {
      nombre: {
        in: [...new Set(usuariosDemoBase.map((usuario) => usuario.rolNombre))],
      },
    },
  });
  const rolesIndexados = new Map(roles.map((rol) => [rol.nombre, rol.id]));

  for (const usuario of usuariosDemoBase) {
    await prisma.usuario.upsert({
      where: { email: usuario.email },
      update: {
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        telefono: usuario.telefono,
        passwordHash,
        rolId: rolesIndexados.get(usuario.rolNombre)!,
        estado: "ACTIVO",
      },
      create: {
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        email: usuario.email,
        telefono: usuario.telefono,
        passwordHash,
        rolId: rolesIndexados.get(usuario.rolNombre)!,
        estado: "ACTIVO",
      },
    });
  }
}

async function seedClientesDemo() {
  const usuarios = await prisma.usuario.findMany({
    where: {
      email: {
        in: [...new Set(clientesDemoBase.map((cliente) => cliente.creadoPorEmail))],
      },
    },
    select: {
      id: true,
      email: true,
    },
  });
  const usuariosIndexados = new Map(usuarios.map((usuario) => [usuario.email, usuario.id]));

  for (const cliente of clientesDemoBase) {
    await prisma.cliente.upsert({
      where: { numeroDocumento: cliente.numeroDocumento },
      update: {
        tipoPersona: cliente.tipoPersona,
        nombresORazonSocial: cliente.nombresORazonSocial,
        tipoDocumento: cliente.tipoDocumento,
        numeroDocumento: cliente.numeroDocumento,
        email: cliente.email,
        telefono: cliente.telefono,
        direccion: cliente.direccion,
        origen: cliente.origen,
        estado: cliente.estado,
        esCompartido: cliente.esCompartido,
        creadoPorId: usuariosIndexados.get(cliente.creadoPorEmail) ?? null,
      },
      create: {
        tipoPersona: cliente.tipoPersona,
        nombresORazonSocial: cliente.nombresORazonSocial,
        tipoDocumento: cliente.tipoDocumento,
        numeroDocumento: cliente.numeroDocumento,
        email: cliente.email,
        telefono: cliente.telefono,
        direccion: cliente.direccion,
        origen: cliente.origen,
        estado: cliente.estado,
        esCompartido: cliente.esCompartido,
        creadoPorId: usuariosIndexados.get(cliente.creadoPorEmail) ?? null,
      },
    });
  }
}

async function seedContactosClienteDemo() {
  const clientes = await prisma.cliente.findMany({
    where: {
      numeroDocumento: {
        in: contactosClienteDemoBase.map((contacto) => contacto.clienteDocumento),
      },
    },
  });

  const clientesIndexados = new Map(
    clientes.map((cliente) => [cliente.numeroDocumento, cliente.id]),
  );

  for (const contacto of contactosClienteDemoBase) {
    const clienteId = clientesIndexados.get(contacto.clienteDocumento)!;
    const existente = await prisma.contactoCliente.findFirst({
      where: {
        clienteId,
        email: contacto.email,
      },
      select: {
        id: true,
      },
    });

    if (existente) {
      await prisma.contactoCliente.update({
        where: {
          id: existente.id,
        },
        data: {
          nombre: contacto.nombre,
          cargo: contacto.cargo,
          email: contacto.email,
          telefono: contacto.telefono,
          esPrincipal: contacto.esPrincipal,
        },
      });
      continue;
    }

    await prisma.contactoCliente.create({
      data: {
        clienteId,
        nombre: contacto.nombre,
        cargo: contacto.cargo,
        email: contacto.email,
        telefono: contacto.telefono,
        esPrincipal: contacto.esPrincipal,
      },
    });
  }
}

async function seedExpedientesDemo() {
  const [areas, usuarios, clientes, tiposDocumento] = await prisma.$transaction([
    prisma.areaPractica.findMany(),
    prisma.usuario.findMany({
      where: {
        OR: [
          {
            email: {
              in: usuariosDemoBase.map((usuario) => usuario.email),
            },
          },
          {
            email: process.env.SEED_ADMIN_EMAIL ?? "admin@estudiolegal.local",
          },
        ],
      },
    }),
    prisma.cliente.findMany({
      where: {
        numeroDocumento: {
          in: clientesDemoBase.map((cliente) => cliente.numeroDocumento),
        },
      },
    }),
    prisma.tipoDocumento.findMany(),
  ]);

  const areasIndexadas = new Map(areas.map((area) => [area.slug, area.id]));
  const usuariosIndexados = new Map(
    usuarios.map((usuario) => [usuario.email, usuario.id]),
  );
  const clientesIndexados = new Map(
    clientes.map((cliente) => [cliente.numeroDocumento, cliente.id]),
  );
  const tiposDocumentoIndexados = new Map(
    tiposDocumento.map((tipo) => [tipo.nombre, tipo.id]),
  );

  for (const expediente of expedientesDemoBase) {
    const expedientePersistido = await prisma.expediente.upsert({
      where: { codigoInterno: expediente.codigoInterno },
      update: {
        clienteId: clientesIndexados.get(expediente.clienteDocumento)!,
        areaPracticaId: areasIndexadas.get(expediente.areaSlug)!,
        responsableId: usuariosIndexados.get(expediente.responsableEmail)!,
        titulo: expediente.titulo,
        descripcion: expediente.descripcion,
        contraparte: expediente.contraparte,
        organoJudicial: expediente.organoJudicial,
        numeroExpedienteExterno: expediente.numeroExpedienteExterno,
        estado: expediente.estado,
        prioridad: expediente.prioridad,
        resumenEjecutivo: expediente.descripcion,
        siguientePaso: expediente.actuacionDescripcion,
        fechaApertura: expediente.fechaApertura,
        fechaCierre:
          expediente.estado === "CERRADO" ? expediente.actuacionFecha : null,
      },
      create: {
        codigoInterno: expediente.codigoInterno,
        clienteId: clientesIndexados.get(expediente.clienteDocumento)!,
        areaPracticaId: areasIndexadas.get(expediente.areaSlug)!,
        responsableId: usuariosIndexados.get(expediente.responsableEmail)!,
        titulo: expediente.titulo,
        descripcion: expediente.descripcion,
        contraparte: expediente.contraparte,
        organoJudicial: expediente.organoJudicial,
        numeroExpedienteExterno: expediente.numeroExpedienteExterno,
        estado: expediente.estado,
        prioridad: expediente.prioridad,
        resumenEjecutivo: expediente.descripcion,
        siguientePaso: expediente.actuacionDescripcion,
        fechaApertura: expediente.fechaApertura,
        fechaCierre:
          expediente.estado === "CERRADO" ? expediente.actuacionFecha : null,
      },
    });

    await prisma.expedienteUsuario.upsert({
      where: {
        expedienteId_usuarioId: {
          expedienteId: expedientePersistido.id,
          usuarioId: usuariosIndexados.get(expediente.responsableEmail)!,
        },
      },
      update: {
        rolEnExpediente: "RESPONSABLE",
        recibeAlertas: true,
      },
      create: {
        expedienteId: expedientePersistido.id,
        usuarioId: usuariosIndexados.get(expediente.responsableEmail)!,
        rolEnExpediente: "RESPONSABLE",
        recibeAlertas: true,
      },
    });

    await prisma.expedienteUsuario.upsert({
      where: {
        expedienteId_usuarioId: {
          expedienteId: expedientePersistido.id,
          usuarioId: usuariosIndexados.get(expediente.colaboradorEmail)!,
        },
      },
      update: {
        rolEnExpediente: "COLABORADOR",
        recibeAlertas: true,
      },
      create: {
        expedienteId: expedientePersistido.id,
        usuarioId: usuariosIndexados.get(expediente.colaboradorEmail)!,
        rolEnExpediente: "COLABORADOR",
        recibeAlertas: true,
      },
    });

    const totalActuaciones = await prisma.actuacion.count({
      where: {
        expedienteId: expedientePersistido.id,
      },
    });

    if (totalActuaciones === 0) {
      await prisma.actuacion.create({
        data: {
          expedienteId: expedientePersistido.id,
          usuarioId: usuariosIndexados.get(expediente.responsableEmail)!,
          tipo: "TAREA",
          fechaEvento: expediente.actuacionFecha,
          descripcion: expediente.actuacionDescripcion,
        },
      });
    }

    const totalNotas = await prisma.notaExpediente.count({
      where: {
        expedienteId: expedientePersistido.id,
      },
    });

    if (totalNotas === 0) {
      await prisma.notaExpediente.createMany({
        data: [
          {
            expedienteId: expedientePersistido.id,
            autorId: usuariosIndexados.get(expediente.responsableEmail)!,
            titulo: "Resumen inicial del expediente",
            tipo: "RESUMEN",
            contenido: expediente.descripcion,
            destacado: true,
            visibilidad: "INTERNA",
          },
          {
            expedienteId: expedientePersistido.id,
            autorId: usuariosIndexados.get(expediente.colaboradorEmail)!,
            titulo: "Proximo avance sugerido",
            tipo: "AVANCE",
            contenido: expediente.actuacionDescripcion,
            destacado: false,
            visibilidad: "PRIVADA",
          },
        ],
      });
    }

    const totalDocumentos = await prisma.documento.count({
      where: {
        expedienteId: expedientePersistido.id,
      },
    });

    if (totalDocumentos === 0) {
      const contenidoTexto = [
        `Expediente: ${expediente.codigoInterno}`,
        `Titulo: ${expediente.titulo}`,
        `Cliente: ${clientesDemoBase.find((cliente) => cliente.numeroDocumento === expediente.clienteDocumento)?.nombresORazonSocial ?? ""}`,
        `Resumen: ${expediente.descripcion}`,
        `Ultimo avance: ${expediente.actuacionDescripcion}`,
      ].join("\n");
      const archivoBuffer = Buffer.from(contenidoTexto, "utf8");

      await prisma.documento.create({
        data: {
          expedienteId: expedientePersistido.id,
          tipoDocumentoId:
            tiposDocumentoIndexados.get("Demanda") ??
            tiposDocumentoIndexados.values().next().value!,
          subidoPorId: usuariosIndexados.get(expediente.responsableEmail)!,
          nombreOriginal: `${expediente.codigoInterno.toLowerCase()}-memoria.txt`,
          nombreAlmacenado: `${expediente.codigoInterno.toLowerCase()}-memoria.txt`,
          mimeType: "text/plain",
          tamanoBytes: BigInt(archivoBuffer.length),
          hashSha256: createHash("sha256").update(archivoBuffer).digest("hex"),
          archivo: archivoBuffer,
          estadoRevision: expediente.estado === "CERRADO" ? "REVISADO" : "POR_REVISAR",
          descripcionInterna: "Memoria inicial del expediente para pruebas funcionales.",
          fechaDocumento: expediente.actuacionFecha,
          esConfidencial: true,
        },
      });
    }
  }
}

async function seedAvisosDemo() {
  const [expedientes, usuarios] = await prisma.$transaction([
    prisma.expediente.findMany({
      where: {
        codigoInterno: {
          in: avisosDemoBase.map((aviso) => aviso.expedienteCodigo),
        },
      },
      select: {
        id: true,
        codigoInterno: true,
      },
    }),
    prisma.usuario.findMany({
      where: {
        email: {
          in: avisosDemoBase.map((aviso) => aviso.asignadoEmail),
        },
      },
      select: {
        id: true,
        email: true,
      },
    }),
  ]);

  const expedientesIndexados = new Map(
    expedientes.map((expediente) => [expediente.codigoInterno, expediente.id]),
  );
  const usuariosIndexados = new Map(
    usuarios.map((usuario) => [usuario.email, usuario.id]),
  );

  for (const aviso of avisosDemoBase) {
    const existente = await prisma.aviso.findFirst({
      where: {
        expedienteId: expedientesIndexados.get(aviso.expedienteCodigo)!,
        titulo: aviso.titulo,
      },
      select: {
        id: true,
      },
    });

    if (existente) {
      await prisma.aviso.update({
        where: {
          id: existente.id,
        },
        data: {
          asignadoAId: usuariosIndexados.get(aviso.asignadoEmail)!,
          descripcion: aviso.descripcion,
          tipoAviso: aviso.tipoAviso,
          fechaRecordatorio: aviso.fechaRecordatorio,
          fechaVencimiento: aviso.fechaVencimiento,
          prioridad: aviso.prioridad,
          estado: "PENDIENTE",
        },
      });
      continue;
    }

    await prisma.aviso.create({
      data: {
        expedienteId: expedientesIndexados.get(aviso.expedienteCodigo)!,
        asignadoAId: usuariosIndexados.get(aviso.asignadoEmail)!,
        titulo: aviso.titulo,
        descripcion: aviso.descripcion,
        tipoAviso: aviso.tipoAviso,
        fechaRecordatorio: aviso.fechaRecordatorio,
        fechaVencimiento: aviso.fechaVencimiento,
        prioridad: aviso.prioridad,
        estado: "PENDIENTE",
      },
    });
  }
}

async function seedLeadsDemo() {
  const [areas, usuarios] = await prisma.$transaction([
    prisma.areaPractica.findMany({
      where: {
        slug: {
          in: leadsDemoBase.map((lead) => lead.areaSlug),
        },
      },
      select: {
        id: true,
        slug: true,
      },
    }),
    prisma.usuario.findMany({
      where: {
        email: {
          in: [
            ...new Set(
              leadsDemoBase.flatMap((lead) => [
                lead.creadoPorEmail,
                lead.asignadoEmail,
              ]),
            ),
            process.env.SEED_ADMIN_EMAIL ?? "admin@estudiolegal.local",
          ],
        },
      },
      select: {
        id: true,
        email: true,
      },
    }),
  ]);

  const areasIndexadas = new Map(areas.map((area) => [area.slug, area.id]));
  const usuariosIndexados = new Map(usuarios.map((usuario) => [usuario.email, usuario.id]));

  for (const lead of leadsDemoBase) {
    const existente = await prisma.formularioContacto.findFirst({
      where: {
        email: lead.email,
      },
      select: {
        id: true,
      },
    });

    if (existente) {
      await prisma.formularioContacto.update({
        where: {
          id: existente.id,
        },
        data: {
          creadoPorId: usuariosIndexados.get(lead.creadoPorEmail) ?? null,
          nombre: lead.nombre,
          telefono: lead.telefono,
          empresa: lead.empresa,
          mensaje: lead.mensaje,
          areaPracticaId: areasIndexadas.get(lead.areaSlug) ?? null,
          asignadoAId: usuariosIndexados.get(lead.asignadoEmail) ?? null,
          estado: lead.estado,
          esCompartido: lead.esCompartido,
          origen: "MANUAL",
          origenUrl: "/contacto",
        },
      });
      continue;
    }

    await prisma.formularioContacto.create({
      data: {
        creadoPorId: usuariosIndexados.get(lead.creadoPorEmail) ?? null,
        nombre: lead.nombre,
        email: lead.email,
        telefono: lead.telefono,
        empresa: lead.empresa,
        mensaje: lead.mensaje,
        areaPracticaId: areasIndexadas.get(lead.areaSlug) ?? null,
        asignadoAId: usuariosIndexados.get(lead.asignadoEmail) ?? null,
        estado: lead.estado,
        esCompartido: lead.esCompartido,
        origen: "MANUAL",
        origenUrl: "/contacto",
      },
    });
  }
}

async function main() {
  const passwordHash = await buildSeedPasswordHash();

  await seedPermisosYRoles();
  await seedCatalogos();
  await seedAdmin(passwordHash);
  await seedEquipoDemo(passwordHash);

  if (shouldSeedDemoData) {
    await seedClientesDemo();
    await seedContactosClienteDemo();
    await seedExpedientesDemo();
    await seedAvisosDemo();
    await seedLeadsDemo();
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
