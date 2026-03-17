-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('ACTIVO', 'INACTIVO', 'BLOQUEADO', 'CAMBIO_PASSWORD_PENDIENTE');

-- CreateEnum
CREATE TYPE "TipoPersona" AS ENUM ('NATURAL', 'JURIDICA');

-- CreateEnum
CREATE TYPE "EstadoCliente" AS ENUM ('ACTIVO', 'INACTIVO', 'POTENCIAL', 'ARCHIVADO');

-- CreateEnum
CREATE TYPE "OrigenRegistro" AS ENUM ('WEB', 'REFERIDO', 'MANUAL', 'ALIANZA', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoExpediente" AS ENUM ('ABIERTO', 'EN_PROCESO', 'EN_ESPERA', 'CERRADO', 'ARCHIVADO');

-- CreateEnum
CREATE TYPE "Prioridad" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "NivelConfidencialidad" AS ENUM ('BAJO', 'MEDIO', 'ALTO', 'RESTRINGIDO');

-- CreateEnum
CREATE TYPE "RolEnExpediente" AS ENUM ('RESPONSABLE', 'COLABORADOR', 'LECTOR');

-- CreateEnum
CREATE TYPE "TipoActuacion" AS ENUM ('AUDIENCIA', 'ESCRITO', 'REUNION', 'LLAMADA', 'NOTIFICACION', 'TAREA', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoAviso" AS ENUM ('VENCIMIENTO', 'AUDIENCIA', 'RECORDATORIO', 'RENOVACION', 'TAREA', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoAviso" AS ENUM ('PENDIENTE', 'COMPLETADO', 'VENCIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "VisibilidadNota" AS ENUM ('INTERNA', 'PRIVADA');

-- CreateEnum
CREATE TYPE "EstadoLead" AS ENUM ('NUEVO', 'EN_REVISION', 'CONTACTADO', 'CONVERTIDO', 'DESCARTADO');

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(60) NOT NULL,
    "descripcion" VARCHAR(255),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permisos" (
    "id" UUID NOT NULL,
    "clave" VARCHAR(120) NOT NULL,
    "modulo" VARCHAR(80) NOT NULL,
    "descripcion" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles_permisos" (
    "id" UUID NOT NULL,
    "rolId" UUID NOT NULL,
    "permisoId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "rolId" UUID NOT NULL,
    "nombres" VARCHAR(120) NOT NULL,
    "apellidos" VARCHAR(120) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "telefono" VARCHAR(30),
    "estado" "EstadoUsuario" NOT NULL DEFAULT 'ACTIVO',
    "ultimoAcceso" TIMESTAMPTZ(6),
    "deletedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "jti" VARCHAR(120) NOT NULL,
    "tokenHash" VARCHAR(255),
    "expiraEn" TIMESTAMPTZ(6) NOT NULL,
    "revocadoEn" TIMESTAMPTZ(6),
    "ip" VARCHAR(64),
    "userAgent" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" UUID NOT NULL,
    "tipoPersona" "TipoPersona" NOT NULL,
    "nombresORazonSocial" VARCHAR(180) NOT NULL,
    "tipoDocumento" VARCHAR(40),
    "numeroDocumento" VARCHAR(40),
    "email" VARCHAR(255),
    "telefono" VARCHAR(30),
    "direccion" VARCHAR(255),
    "origen" "OrigenRegistro" NOT NULL DEFAULT 'MANUAL',
    "estado" "EstadoCliente" NOT NULL DEFAULT 'ACTIVO',
    "observaciones" TEXT,
    "deletedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contactos_cliente" (
    "id" UUID NOT NULL,
    "clienteId" UUID NOT NULL,
    "nombre" VARCHAR(140) NOT NULL,
    "cargo" VARCHAR(120),
    "email" VARCHAR(255),
    "telefono" VARCHAR(30),
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "contactos_cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "areas_practica" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "areas_practica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expedientes" (
    "id" UUID NOT NULL,
    "codigoInterno" VARCHAR(60) NOT NULL,
    "clienteId" UUID NOT NULL,
    "areaPracticaId" UUID NOT NULL,
    "responsableId" UUID NOT NULL,
    "titulo" VARCHAR(180) NOT NULL,
    "descripcion" TEXT,
    "contraparte" VARCHAR(180),
    "organoJudicial" VARCHAR(180),
    "numeroExpedienteExterno" VARCHAR(80),
    "estado" "EstadoExpediente" NOT NULL DEFAULT 'ABIERTO',
    "prioridad" "Prioridad" NOT NULL DEFAULT 'MEDIA',
    "nivelConfidencialidad" "NivelConfidencialidad" NOT NULL DEFAULT 'ALTO',
    "fechaApertura" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaCierre" TIMESTAMPTZ(6),
    "deletedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "expedientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expediente_usuarios" (
    "id" UUID NOT NULL,
    "expedienteId" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "rolEnExpediente" "RolEnExpediente" NOT NULL DEFAULT 'COLABORADOR',
    "recibeAlertas" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "expediente_usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actuaciones" (
    "id" UUID NOT NULL,
    "expedienteId" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "tipo" "TipoActuacion" NOT NULL DEFAULT 'OTRO',
    "fechaEvento" TIMESTAMPTZ(6) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "resultado" TEXT,
    "proximaAccion" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "actuaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_documento" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tipos_documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" UUID NOT NULL,
    "expedienteId" UUID NOT NULL,
    "tipoDocumentoId" UUID NOT NULL,
    "subidoPorId" UUID NOT NULL,
    "nombreOriginal" VARCHAR(255) NOT NULL,
    "nombreAlmacenado" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(120) NOT NULL,
    "tamanoBytes" BIGINT,
    "hashSha256" CHAR(64),
    "s3Key" VARCHAR(255),
    "bucket" VARCHAR(120),
    "version" INTEGER NOT NULL DEFAULT 1,
    "fechaDocumento" TIMESTAMPTZ(6),
    "esConfidencial" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avisos" (
    "id" UUID NOT NULL,
    "expedienteId" UUID NOT NULL,
    "asignadoAId" UUID NOT NULL,
    "actuacionId" UUID,
    "titulo" VARCHAR(180) NOT NULL,
    "descripcion" TEXT,
    "tipoAviso" "TipoAviso" NOT NULL DEFAULT 'RECORDATORIO',
    "fechaRecordatorio" TIMESTAMPTZ(6),
    "fechaVencimiento" TIMESTAMPTZ(6) NOT NULL,
    "prioridad" "Prioridad" NOT NULL DEFAULT 'MEDIA',
    "estado" "EstadoAviso" NOT NULL DEFAULT 'PENDIENTE',
    "canal" VARCHAR(40),
    "completadoEn" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "avisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas_expediente" (
    "id" UUID NOT NULL,
    "expedienteId" UUID NOT NULL,
    "autorId" UUID NOT NULL,
    "contenido" TEXT NOT NULL,
    "visibilidad" "VisibilidadNota" NOT NULL DEFAULT 'PRIVADA',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notas_expediente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formularios_contacto" (
    "id" UUID NOT NULL,
    "areaPracticaId" UUID,
    "asignadoAId" UUID,
    "clienteId" UUID,
    "nombre" VARCHAR(140) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "telefono" VARCHAR(30),
    "empresa" VARCHAR(140),
    "mensaje" TEXT NOT NULL,
    "origenUrl" VARCHAR(255),
    "origen" "OrigenRegistro" NOT NULL DEFAULT 'WEB',
    "estado" "EstadoLead" NOT NULL DEFAULT 'NUEVO',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "formularios_contacto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_eventos" (
    "id" UUID NOT NULL,
    "usuarioId" UUID,
    "entidad" VARCHAR(120) NOT NULL,
    "entidadId" VARCHAR(60),
    "accion" VARCHAR(120) NOT NULL,
    "detalle" JSONB,
    "ip" VARCHAR(64),
    "userAgent" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_eventos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE INDEX "roles_activo_idx" ON "roles"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "permisos_clave_key" ON "permisos"("clave");

-- CreateIndex
CREATE INDEX "permisos_modulo_idx" ON "permisos"("modulo");

-- CreateIndex
CREATE INDEX "roles_permisos_permisoId_idx" ON "roles_permisos"("permisoId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_permisos_rolId_permisoId_key" ON "roles_permisos"("rolId", "permisoId");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_rolId_estado_idx" ON "usuarios"("rolId", "estado");

-- CreateIndex
CREATE INDEX "usuarios_deletedAt_idx" ON "usuarios"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_jti_key" ON "refresh_tokens"("jti");

-- CreateIndex
CREATE INDEX "refresh_tokens_usuarioId_revocadoEn_idx" ON "refresh_tokens"("usuarioId", "revocadoEn");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_numeroDocumento_key" ON "clientes"("numeroDocumento");

-- CreateIndex
CREATE INDEX "clientes_estado_origen_idx" ON "clientes"("estado", "origen");

-- CreateIndex
CREATE INDEX "clientes_deletedAt_idx" ON "clientes"("deletedAt");

-- CreateIndex
CREATE INDEX "contactos_cliente_clienteId_esPrincipal_idx" ON "contactos_cliente"("clienteId", "esPrincipal");

-- CreateIndex
CREATE UNIQUE INDEX "areas_practica_nombre_key" ON "areas_practica"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "areas_practica_slug_key" ON "areas_practica"("slug");

-- CreateIndex
CREATE INDEX "areas_practica_activa_idx" ON "areas_practica"("activa");

-- CreateIndex
CREATE UNIQUE INDEX "expedientes_codigoInterno_key" ON "expedientes"("codigoInterno");

-- CreateIndex
CREATE INDEX "expedientes_clienteId_estado_idx" ON "expedientes"("clienteId", "estado");

-- CreateIndex
CREATE INDEX "expedientes_areaPracticaId_estado_idx" ON "expedientes"("areaPracticaId", "estado");

-- CreateIndex
CREATE INDEX "expedientes_responsableId_idx" ON "expedientes"("responsableId");

-- CreateIndex
CREATE INDEX "expedientes_deletedAt_idx" ON "expedientes"("deletedAt");

-- CreateIndex
CREATE INDEX "expediente_usuarios_usuarioId_idx" ON "expediente_usuarios"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "expediente_usuarios_expedienteId_usuarioId_key" ON "expediente_usuarios"("expedienteId", "usuarioId");

-- CreateIndex
CREATE INDEX "actuaciones_expedienteId_fechaEvento_idx" ON "actuaciones"("expedienteId", "fechaEvento");

-- CreateIndex
CREATE INDEX "actuaciones_usuarioId_idx" ON "actuaciones"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_documento_nombre_key" ON "tipos_documento"("nombre");

-- CreateIndex
CREATE INDEX "tipos_documento_activo_idx" ON "tipos_documento"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "documentos_s3Key_key" ON "documentos"("s3Key");

-- CreateIndex
CREATE INDEX "documentos_expedienteId_idx" ON "documentos"("expedienteId");

-- CreateIndex
CREATE INDEX "documentos_tipoDocumentoId_idx" ON "documentos"("tipoDocumentoId");

-- CreateIndex
CREATE INDEX "documentos_subidoPorId_idx" ON "documentos"("subidoPorId");

-- CreateIndex
CREATE INDEX "documentos_deletedAt_idx" ON "documentos"("deletedAt");

-- CreateIndex
CREATE INDEX "avisos_fechaVencimiento_estado_idx" ON "avisos"("fechaVencimiento", "estado");

-- CreateIndex
CREATE INDEX "avisos_asignadoAId_estado_idx" ON "avisos"("asignadoAId", "estado");

-- CreateIndex
CREATE INDEX "avisos_expedienteId_idx" ON "avisos"("expedienteId");

-- CreateIndex
CREATE INDEX "notas_expediente_expedienteId_createdAt_idx" ON "notas_expediente"("expedienteId", "createdAt");

-- CreateIndex
CREATE INDEX "notas_expediente_autorId_idx" ON "notas_expediente"("autorId");

-- CreateIndex
CREATE INDEX "formularios_contacto_estado_createdAt_idx" ON "formularios_contacto"("estado", "createdAt");

-- CreateIndex
CREATE INDEX "formularios_contacto_areaPracticaId_idx" ON "formularios_contacto"("areaPracticaId");

-- CreateIndex
CREATE INDEX "formularios_contacto_clienteId_idx" ON "formularios_contacto"("clienteId");

-- CreateIndex
CREATE INDEX "auditoria_eventos_entidad_entidadId_idx" ON "auditoria_eventos"("entidad", "entidadId");

-- CreateIndex
CREATE INDEX "auditoria_eventos_createdAt_idx" ON "auditoria_eventos"("createdAt");

-- CreateIndex
CREATE INDEX "auditoria_eventos_usuarioId_idx" ON "auditoria_eventos"("usuarioId");

-- AddForeignKey
ALTER TABLE "roles_permisos" ADD CONSTRAINT "roles_permisos_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_permisos" ADD CONSTRAINT "roles_permisos_permisoId_fkey" FOREIGN KEY ("permisoId") REFERENCES "permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contactos_cliente" ADD CONSTRAINT "contactos_cliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expedientes" ADD CONSTRAINT "expedientes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expedientes" ADD CONSTRAINT "expedientes_areaPracticaId_fkey" FOREIGN KEY ("areaPracticaId") REFERENCES "areas_practica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expedientes" ADD CONSTRAINT "expedientes_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expediente_usuarios" ADD CONSTRAINT "expediente_usuarios_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "expedientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expediente_usuarios" ADD CONSTRAINT "expediente_usuarios_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actuaciones" ADD CONSTRAINT "actuaciones_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "expedientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actuaciones" ADD CONSTRAINT "actuaciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "expedientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_tipoDocumentoId_fkey" FOREIGN KEY ("tipoDocumentoId") REFERENCES "tipos_documento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_subidoPorId_fkey" FOREIGN KEY ("subidoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avisos" ADD CONSTRAINT "avisos_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "expedientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avisos" ADD CONSTRAINT "avisos_asignadoAId_fkey" FOREIGN KEY ("asignadoAId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avisos" ADD CONSTRAINT "avisos_actuacionId_fkey" FOREIGN KEY ("actuacionId") REFERENCES "actuaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_expediente" ADD CONSTRAINT "notas_expediente_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "expedientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_expediente" ADD CONSTRAINT "notas_expediente_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formularios_contacto" ADD CONSTRAINT "formularios_contacto_areaPracticaId_fkey" FOREIGN KEY ("areaPracticaId") REFERENCES "areas_practica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formularios_contacto" ADD CONSTRAINT "formularios_contacto_asignadoAId_fkey" FOREIGN KEY ("asignadoAId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formularios_contacto" ADD CONSTRAINT "formularios_contacto_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_eventos" ADD CONSTRAINT "auditoria_eventos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
