-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "creadoPorId" UUID,
ADD COLUMN     "esCompartido" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "formularios_contacto" ADD COLUMN     "creadoPorId" UUID,
ADD COLUMN     "esCompartido" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "clientes_creadoPorId_esCompartido_idx" ON "clientes"("creadoPorId", "esCompartido");

-- CreateIndex
CREATE INDEX "formularios_contacto_creadoPorId_esCompartido_idx" ON "formularios_contacto"("creadoPorId", "esCompartido");

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formularios_contacto" ADD CONSTRAINT "formularios_contacto_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
