-- CreateEnum
CREATE TYPE "EstadoRevisionDocumento" AS ENUM ('POR_REVISAR', 'REVISADO', 'OBSERVADO');

-- CreateEnum
CREATE TYPE "TipoNotaExpediente" AS ENUM ('RESUMEN', 'CONCLUSION', 'AVANCE', 'PENDIENTE', 'CONTEXTO', 'OTRO');

-- AlterTable
ALTER TABLE "documentos" ADD COLUMN     "archivo" BYTEA,
ADD COLUMN     "descripcionInterna" TEXT,
ADD COLUMN     "estadoRevision" "EstadoRevisionDocumento" NOT NULL DEFAULT 'POR_REVISAR';

-- AlterTable
ALTER TABLE "expedientes" ADD COLUMN     "resumenEjecutivo" TEXT,
ADD COLUMN     "siguientePaso" TEXT;

-- AlterTable
ALTER TABLE "notas_expediente" ADD COLUMN     "destacado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tipo" "TipoNotaExpediente" NOT NULL DEFAULT 'OTRO',
ADD COLUMN     "titulo" VARCHAR(180);

-- CreateIndex
CREATE INDEX "documentos_estadoRevision_idx" ON "documentos"("estadoRevision");

-- CreateIndex
CREATE INDEX "notas_expediente_expedienteId_tipo_idx" ON "notas_expediente"("expedienteId", "tipo");
