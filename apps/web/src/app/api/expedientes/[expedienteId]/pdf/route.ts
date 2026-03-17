import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import { apiRequestWithSession } from "@/lib/auth-server";
import { unauthorizedRouteResponse } from "@/lib/api-route-helpers";
import type { ExpedienteDetalleEnvelope } from "@/lib/crm-expedientes";

type RouteContext = {
  params: Promise<{
    expedienteId: string;
  }>;
};

export const runtime = "nodejs";

const notaLabels = {
  RESUMEN: "Resumenes",
  CONCLUSION: "Conclusiones",
  AVANCE: "Avances",
  PENDIENTE: "Pendientes",
  CONTEXTO: "Contexto",
  OTRO: "Notas varias",
} as const;

function formatDate(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function collectPdfBuffer(doc: PDFKit.PDFDocument) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

export async function buildPdf(
  detail: NonNullable<ExpedienteDetalleEnvelope["data"]>,
  origin: string,
) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 48,
    info: {
      Title: `Ficha ${detail.expediente.numero}`,
      Author: "ATRIA",
    },
  });
  const bufferPromise = collectPdfBuffer(doc);
  let y = 48;

  const ensureSpace = (height: number) => {
    if (y + height <= doc.page.height - 48) {
      return;
    }

    doc.addPage();
    y = 48;
  };

  const writeTitle = (text: string) => {
    ensureSpace(42);
    doc.font("Helvetica-Bold").fontSize(19).fillColor("#0d1b35").text(text, 48, y);
    y = doc.y + 10;
  };

  const writeParagraph = (text: string, options?: PDFKit.Mixins.TextOptions) => {
    ensureSpace(52);
    doc
      .font("Helvetica")
      .fontSize(10.5)
      .fillColor("#425167")
      .text(text, 48, y, {
        width: 500,
        lineGap: 3,
        ...options,
      });
    y = doc.y + 8;
  };

  doc.rect(0, 0, doc.page.width, 124).fill("#0d1b35");
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(23).text("ATRIA", 48, 44);
  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor("#d7dde7")
    .text("Gestion Integral Empresarial", 48, 74);
  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor("#ffffff")
    .text(detail.expediente.numero, 48, 92);
  y = 144;

  writeTitle(detail.expediente.titulo);
  writeParagraph(
    `Cliente: ${detail.expediente.cliente} | Materia: ${detail.expediente.materia} | Responsable: ${detail.expediente.abogado}`,
  );
  writeParagraph(
    `Estado: ${detail.expediente.estadoInterno} | Prioridad: ${detail.expediente.prioridad} | Apertura: ${formatDate(detail.expediente.fechaApertura)}`,
  );

  if (detail.expediente.descripcion) {
    writeTitle("Descripcion general");
    writeParagraph(detail.expediente.descripcion);
  }

  writeTitle("Sintesis operativa");
  writeParagraph(
    detail.expediente.resumenEjecutivo ??
      "Aun no se ha registrado un resumen ejecutivo del expediente.",
  );
  writeParagraph(
    `Siguiente paso: ${detail.expediente.siguientePaso ?? "Pendiente de definicion."}`,
  );

  writeTitle("Documentacion");
  if (detail.documentos.length === 0) {
    writeParagraph("No hay documentos asociados hasta el momento.");
  } else {
    for (const documento of detail.documentos) {
      ensureSpace(60);
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#0d1b35")
        .text(`${documento.tipoDocumento.nombre} - ${documento.nombreOriginal}`, 48, y, {
          width: 500,
        });
      y = doc.y + 2;
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#425167")
        .text(
          `Estado: ${documento.estadoRevision} | Fecha: ${formatDate(documento.fechaDocumento)} | Subido por: ${documento.subidoPor.nombreCompleto}`,
          48,
          y,
          { width: 500 },
        );
      y = doc.y + 2;

      if (documento.descripcionInterna) {
        doc
          .font("Helvetica")
          .fontSize(10)
          .fillColor("#425167")
          .text(`Nota interna: ${documento.descripcionInterna}`, 48, y, {
            width: 500,
          });
        y = doc.y + 2;
      }

      const link = `${origin}/api/expedientes/${detail.expediente.id}/documentos/${documento.id}/descarga`;
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#16a86a")
        .text("Descargar documento", 48, y, {
          width: 220,
          underline: true,
          link,
        });
      y = doc.y + 10;
    }
  }

  writeTitle("Notas y conocimiento acumulado");
  const notasPorTipo = Object.entries(notaLabels).map(([tipo, label]) => ({
    tipo,
    label,
    items: detail.notas.filter((nota) => nota.tipo === tipo),
  }));

  for (const bloque of notasPorTipo) {
    if (bloque.items.length === 0) {
      continue;
    }

    ensureSpace(30);
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#0d1b35").text(bloque.label, 48, y);
    y = doc.y + 6;

    for (const nota of bloque.items) {
      ensureSpace(50);
      doc
        .font("Helvetica-Bold")
        .fontSize(10.5)
        .fillColor("#1a1f2e")
        .text(nota.titulo ?? "Nota interna", 48, y, { width: 500 });
      y = doc.y + 2;
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#425167")
        .text(
          `${nota.autor.nombreCompleto} | ${formatDate(nota.updatedAt)} | ${nota.visibilidad}`,
          48,
          y,
          { width: 500 },
        );
      y = doc.y + 2;
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#425167")
        .text(nota.contenido, 48, y, {
          width: 500,
          lineGap: 3,
        });
      y = doc.y + 10;
    }
  }

  writeTitle("Actuaciones recientes");
  if (detail.actuaciones.length === 0) {
    writeParagraph("No hay actuaciones registradas.");
  } else {
    for (const actuacion of detail.actuaciones) {
      ensureSpace(48);
      doc
        .font("Helvetica-Bold")
        .fontSize(10.5)
        .fillColor("#1a1f2e")
        .text(`${formatDate(actuacion.fechaEvento)} - ${actuacion.tipo}`, 48, y, {
          width: 500,
        });
      y = doc.y + 2;
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#425167")
        .text(
          `${actuacion.usuario.nombreCompleto}: ${actuacion.descripcion}`,
          48,
          y,
          { width: 500, lineGap: 3 },
        );
      y = doc.y + 8;
    }
  }

  doc.end();
  return bufferPromise;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { expedienteId } = await context.params;
  const cookieStore = await cookies();
  const response = await apiRequestWithSession(
    cookieStore,
    `/expedientes/${expedienteId}/detalle`,
    {
      method: "GET",
    },
  );

  if (!response) {
    return unauthorizedRouteResponse();
  }

  const payload = (await response.json()) as ExpedienteDetalleEnvelope;

  if (!response.ok || !payload.ok || !payload.data) {
    return NextResponse.json(
      {
        ok: false,
        mensaje: payload.mensaje ?? "No pudimos generar el PDF solicitado.",
      },
      { status: response.status || 400 },
    );
  }

  const buffer = await buildPdf(payload.data, request.nextUrl.origin);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
        `${payload.data.expediente.numero}-ficha.pdf`,
      )}`,
    },
  });
}
