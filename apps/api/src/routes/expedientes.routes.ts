import { Router } from "express";
import multer from "multer";
import {
  EstadoExpediente,
  EstadoRevisionDocumento,
  NivelConfidencialidad,
  Prioridad,
  TipoNotaExpediente,
  VisibilidadNota,
} from "../generated/prisma/enums.js";
import { AppError } from "../errors/app-error.js";
import {
  authenticate,
  authorizePermissions,
  getAuthContext,
} from "../middlewares/auth.js";
import {
  createExpediente,
  createExpedienteNote,
  getExpedienteDetalleById,
  getExpedienteById,
  getExpedienteDocumentDownload,
  getExpedienteCatalogos,
  listExpedientes,
  MAX_DOCUMENT_SIZE_BYTES,
  updateExpedienteDocument,
  updateExpedienteStatus,
  updateExpedienteWorkspace,
  uploadExpedienteDocument,
} from "../modules/expedientes/expedientes.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { getRequestMetadata } from "../utils/request-metadata.js";

const expedientesRoutes = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_DOCUMENT_SIZE_BYTES,
  },
});

const estadoExpedienteValues = Object.values(EstadoExpediente);
const prioridadValues = Object.values(Prioridad);
const nivelConfidencialidadValues = Object.values(NivelConfidencialidad);
const estadoRevisionDocumentoValues = Object.values(EstadoRevisionDocumento);
const tipoNotaValues = Object.values(TipoNotaExpediente);
const visibilidadNotaValues = Object.values(VisibilidadNota);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readRequiredString(value: unknown, fieldName: string) {
  const trimmed = readOptionalString(value);

  if (!trimmed) {
    throw new AppError(400, `El campo ${fieldName} es obligatorio.`, {
      code: "FIELD_REQUIRED",
      details: { field: fieldName },
    });
  }

  return trimmed;
}

function readOptionalBoolean(value: unknown, fieldName: string) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  throw new AppError(400, `El campo ${fieldName} debe ser booleano.`, {
    code: "FIELD_INVALID_BOOLEAN",
    details: { field: fieldName },
  });
}

function readEnumValue<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  fieldName: string,
) {
  if (typeof value !== "string" || !allowedValues.includes(value as T)) {
    throw new AppError(400, `El campo ${fieldName} contiene un valor invalido.`, {
      code: "FIELD_INVALID_ENUM",
      details: { field: fieldName, allowedValues },
    });
  }

  return value as T;
}

function readOptionalDate(value: unknown, fieldName: string) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new AppError(400, `El campo ${fieldName} debe ser una fecha valida.`, {
      code: "FIELD_INVALID_DATE",
      details: { field: fieldName },
    });
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(400, `El campo ${fieldName} debe ser una fecha valida.`, {
      code: "FIELD_INVALID_DATE",
      details: { field: fieldName },
    });
  }

  return parsed;
}

expedientesRoutes.use(authenticate);

expedientesRoutes.get(
  "/",
  authorizePermissions("expedientes.read"),
  asyncHandler(async (req, res) => {
    const auth = getAuthContext(req);
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;
    const limit =
      typeof req.query.limit === "string" ? Number.parseInt(req.query.limit, 10) : undefined;

    const data = await listExpedientes(auth, {
      search,
      limit: Number.isFinite(limit) ? limit : undefined,
    });

    res.json({
      ok: true,
      data,
    });
  }),
);

expedientesRoutes.get(
  "/catalogo",
  authorizePermissions("expedientes.read"),
  asyncHandler(async (req, res) => {
    const auth = getAuthContext(req);
    const data = await getExpedienteCatalogos(auth);

    res.json({
      ok: true,
      data,
    });
  }),
);

expedientesRoutes.get(
  "/:expedienteId/detalle",
  authorizePermissions("expedientes.read"),
  asyncHandler(async (req, res) => {
    const auth = getAuthContext(req);
    const expedienteId = readRequiredString(
      req.params.expedienteId,
      "expedienteId",
    );
    const data = await getExpedienteDetalleById(expedienteId, auth);

    res.json({
      ok: true,
      data,
    });
  }),
);

expedientesRoutes.get(
  "/:expedienteId/documentos/:documentoId/descarga",
  authorizePermissions("documentos.read"),
  asyncHandler(async (req, res) => {
    const auth = getAuthContext(req);
    const expedienteId = readRequiredString(
      req.params.expedienteId,
      "expedienteId",
    );
    const documentoId = readRequiredString(req.params.documentoId, "documentoId");
    const data = await getExpedienteDocumentDownload(
      expedienteId,
      documentoId,
      auth,
    );

    res.setHeader("Content-Type", data.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(data.nombreArchivo)}`,
    );
    res.send(data.contenido);
  }),
);

expedientesRoutes.get(
  "/:expedienteId",
  authorizePermissions("expedientes.read"),
  asyncHandler(async (req, res) => {
    const auth = getAuthContext(req);
    const expedienteId = readRequiredString(
      req.params.expedienteId,
      "expedienteId",
    );
    const data = await getExpedienteById(expedienteId, auth);

    res.json({
      ok: true,
      data,
    });
  }),
);

expedientesRoutes.post(
  "/",
  authorizePermissions("expedientes.write"),
  asyncHandler(async (req, res) => {
    if (!isObject(req.body)) {
      throw new AppError(400, "Debes enviar un cuerpo JSON valido.", {
        code: "BODY_INVALID",
      });
    }

    const auth = getAuthContext(req);
    const metadata = getRequestMetadata(req);

    const data = await createExpediente(
      {
        codigoInterno: readRequiredString(req.body.codigoInterno, "codigoInterno"),
        clienteId: readRequiredString(req.body.clienteId, "clienteId"),
        areaPracticaId: readRequiredString(req.body.areaPracticaId, "areaPracticaId"),
        responsableId: readRequiredString(req.body.responsableId, "responsableId"),
        titulo: readRequiredString(req.body.titulo, "titulo"),
        descripcion: readOptionalString(req.body.descripcion) ?? null,
        contraparte: readOptionalString(req.body.contraparte) ?? null,
        organoJudicial: readOptionalString(req.body.organoJudicial) ?? null,
        numeroExpedienteExterno:
          readOptionalString(req.body.numeroExpedienteExterno) ?? null,
        prioridad:
          req.body.prioridad === undefined
            ? undefined
            : readEnumValue(req.body.prioridad, prioridadValues, "prioridad"),
        nivelConfidencialidad:
          req.body.nivelConfidencialidad === undefined
            ? undefined
            : readEnumValue(
                req.body.nivelConfidencialidad,
                nivelConfidencialidadValues,
                "nivelConfidencialidad",
              ),
        fechaApertura: readOptionalDate(req.body.fechaApertura, "fechaApertura"),
      },
      auth,
      metadata,
    );

    res.status(201).json({
      ok: true,
      mensaje: "Expediente creado correctamente.",
      data,
    });
  }),
);

expedientesRoutes.patch(
  "/:expedienteId/resumen",
  authorizePermissions("expedientes.write"),
  asyncHandler(async (req, res) => {
    if (!isObject(req.body)) {
      throw new AppError(400, "Debes enviar un cuerpo JSON valido.", {
        code: "BODY_INVALID",
      });
    }

    const auth = getAuthContext(req);
    const metadata = getRequestMetadata(req);
    const expedienteId = readRequiredString(
      req.params.expedienteId,
      "expedienteId",
    );
    const data = await updateExpedienteWorkspace(
      expedienteId,
      {
        resumenEjecutivo: readOptionalString(req.body.resumenEjecutivo) ?? null,
        siguientePaso: readOptionalString(req.body.siguientePaso) ?? null,
      },
      auth,
      metadata,
    );

    res.json({
      ok: true,
      mensaje: "Ficha del expediente actualizada correctamente.",
      data,
    });
  }),
);

expedientesRoutes.post(
  "/:expedienteId/notas",
  authorizePermissions("expedientes.write"),
  asyncHandler(async (req, res) => {
    if (!isObject(req.body)) {
      throw new AppError(400, "Debes enviar un cuerpo JSON valido.", {
        code: "BODY_INVALID",
      });
    }

    const auth = getAuthContext(req);
    const metadata = getRequestMetadata(req);
    const expedienteId = readRequiredString(
      req.params.expedienteId,
      "expedienteId",
    );
    const data = await createExpedienteNote(
      expedienteId,
      {
        titulo: readOptionalString(req.body.titulo) ?? null,
        tipo: readEnumValue(req.body.tipo, tipoNotaValues, "tipo"),
        contenido: readRequiredString(req.body.contenido, "contenido"),
        destacado: readOptionalBoolean(req.body.destacado, "destacado"),
        visibilidad:
          req.body.visibilidad === undefined
            ? undefined
            : readEnumValue(
                req.body.visibilidad,
                visibilidadNotaValues,
                "visibilidad",
              ),
      },
      auth,
      metadata,
    );

    res.status(201).json({
      ok: true,
      mensaje: "Nota del expediente registrada correctamente.",
      data,
    });
  }),
);

expedientesRoutes.post(
  "/:expedienteId/documentos",
  authorizePermissions("documentos.write"),
  upload.single("archivo"),
  asyncHandler(async (req, res) => {
    const auth = getAuthContext(req);
    const metadata = getRequestMetadata(req);
    const expedienteId = readRequiredString(
      req.params.expedienteId,
      "expedienteId",
    );

    if (!req.file) {
      throw new AppError(400, "Debes adjuntar un archivo.", {
        code: "DOCUMENT_REQUIRED",
      });
    }

    const data = await uploadExpedienteDocument(
      expedienteId,
      {
        tipoDocumentoId: readRequiredString(
          req.body.tipoDocumentoId,
          "tipoDocumentoId",
        ),
        nombreOriginal: req.file.originalname,
        mimeType: req.file.mimetype || "application/octet-stream",
        fechaDocumento: readOptionalDate(req.body.fechaDocumento, "fechaDocumento"),
        estadoRevision:
          req.body.estadoRevision === undefined
            ? undefined
            : readEnumValue(
                req.body.estadoRevision,
                estadoRevisionDocumentoValues,
                "estadoRevision",
              ),
        descripcionInterna:
          readOptionalString(req.body.descripcionInterna) ?? null,
        esConfidencial: readOptionalBoolean(
          req.body.esConfidencial,
          "esConfidencial",
        ),
        fileBuffer: req.file.buffer,
      },
      auth,
      metadata,
    );

    res.status(201).json({
      ok: true,
      mensaje: "Documento cargado correctamente.",
      data,
    });
  }),
);

expedientesRoutes.patch(
  "/:expedienteId/documentos/:documentoId",
  authorizePermissions("documentos.write"),
  asyncHandler(async (req, res) => {
    if (!isObject(req.body)) {
      throw new AppError(400, "Debes enviar un cuerpo JSON valido.", {
        code: "BODY_INVALID",
      });
    }

    const auth = getAuthContext(req);
    const metadata = getRequestMetadata(req);
    const expedienteId = readRequiredString(
      req.params.expedienteId,
      "expedienteId",
    );
    const documentoId = readRequiredString(req.params.documentoId, "documentoId");
    const data = await updateExpedienteDocument(
      expedienteId,
      documentoId,
      {
        estadoRevision:
          req.body.estadoRevision === undefined
            ? undefined
            : readEnumValue(
                req.body.estadoRevision,
                estadoRevisionDocumentoValues,
                "estadoRevision",
              ),
        descripcionInterna:
          req.body.descripcionInterna === undefined
            ? undefined
            : readOptionalString(req.body.descripcionInterna) ?? null,
      },
      auth,
      metadata,
    );

    res.json({
      ok: true,
      mensaje: "Documento actualizado correctamente.",
      data,
    });
  }),
);

expedientesRoutes.patch(
  "/:expedienteId/estado",
  authorizePermissions("expedientes.write"),
  asyncHandler(async (req, res) => {
    if (!isObject(req.body)) {
      throw new AppError(400, "Debes enviar un cuerpo JSON valido.", {
        code: "BODY_INVALID",
      });
    }

    const auth = getAuthContext(req);
    const metadata = getRequestMetadata(req);
    const expedienteId = readRequiredString(
      req.params.expedienteId,
      "expedienteId",
    );
    const data = await updateExpedienteStatus(
      expedienteId,
      {
        estado: readEnumValue(req.body.estado, estadoExpedienteValues, "estado"),
      },
      auth,
      metadata,
    );

    res.json({
      ok: true,
      mensaje: "Estado del expediente actualizado correctamente.",
      data,
    });
  }),
);

export { expedientesRoutes };
