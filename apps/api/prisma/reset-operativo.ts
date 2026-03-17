import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

loadEnv({
  path: fileURLToPath(new URL("../../../.env", import.meta.url)),
  quiet: true,
});

if (!process.env.DATABASE_URL) {
  loadEnv({
    path: fileURLToPath(new URL("../../../.env.example", import.meta.url)),
    quiet: true,
  });
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL no esta configurada. Define la conexion en el .env raiz antes de ejecutar el reset.",
  );
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.$transaction(async (tx) => {
    const formularios = await tx.formularioContacto.deleteMany();
    const avisos = await tx.aviso.deleteMany();
    const documentos = await tx.documento.deleteMany();
    const notas = await tx.notaExpediente.deleteMany();
    const actuaciones = await tx.actuacion.deleteMany();
    const participaciones = await tx.expedienteUsuario.deleteMany();
    const expedientes = await tx.expediente.deleteMany();
    const contactos = await tx.contactoCliente.deleteMany();
    const clientes = await tx.cliente.deleteMany();
    const auditoria = await tx.auditoriaEvento.deleteMany({
      where: {
        entidad: {
          in: [
            "clientes",
            "formularios_contacto",
            "expedientes",
            "notas_expediente",
            "documentos",
            "avisos",
          ],
        },
      },
    });

    return {
      formularios: formularios.count,
      avisos: avisos.count,
      documentos: documentos.count,
      notas: notas.count,
      actuaciones: actuaciones.count,
      participaciones: participaciones.count,
      expedientes: expedientes.count,
      contactos: contactos.count,
      clientes: clientes.count,
      auditoria: auditoria.count,
    };
  });

  console.log("Reset operativo completado.");
  console.table(result);
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
