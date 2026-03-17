import { Router } from "express";
import { EstadoLead } from "../generated/prisma/enums.js";
import { AppError } from "../errors/app-error.js";
import {
  authenticate,
  authorizePermissions,
  getAuthContext,
} from "../middlewares/auth.js";
import {
  convertLeadToCliente,
  createLead,
  getContactCatalogo,
  listLeads,
  submitPublicContact,
  updateLead,
} from "../modules/captacion/captacion.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { getRequestMetadata } from "../utils/request-metadata.js";

const captacionRoutes = Router();

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
  const normalized = readOptionalString(value);

  if (!normalized) {
    throw new AppError(400, `El campo ${fieldName} es obligatorio.`, {
      code: "FIELD_REQUIRED",
      details: { field: fieldName },
    });
  }

  return normalized;
}

function readRequiredParam(value: unknown, fieldName: string) {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }

  throw new AppError(400, `El parametro ${fieldName} es obligatorio.`, {
    code: "PARAM_REQUIRED",
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

captacionRoutes.get(
  "/contacto/catalogo",
  asyncHandler(async (_req, res) => {
    const data = await getContactCatalogo();

    res.json({
      ok: true,
      data,
    });
  }),
);

captacionRoutes.post(
  "/contacto",
  asyncHandler(async (req, res) => {
    if (!isObject(req.body)) {
      throw new AppError(400, "Debes enviar un cuerpo JSON valido.", {
        code: "BODY_INVALID",
      });
    }

    const data = await submitPublicContact(
      {
        nombre: readRequiredString(req.body.nombre, "nombre"),
        email: readRequiredString(req.body.email, "email"),
        telefono: readOptionalString(req.body.telefono) ?? null,
        empresa: readOptionalString(req.body.empresa) ?? null,
        mensaje: readRequiredString(req.body.mensaje, "mensaje"),
        areaPracticaId: readOptionalString(req.body.areaPracticaId) ?? null,
        origenUrl: readOptionalString(req.body.origenUrl) ?? null,
      },
      getRequestMetadata(req),
    );

    res.status(201).json({
      ok: true,
      mensaje: "Recibimos tu consulta correctamente.",
      data,
    });
  }),
);

captacionRoutes.use(authenticate);

captacionRoutes.get(
  "/leads",
  authorizePermissions("leads.read"),
  asyncHandler(async (req, res) => {
    const auth = getAuthContext(req);
    const data = await listLeads(auth);

    res.json({
      ok: true,
      data,
    });
  }),
);

captacionRoutes.post(
  "/leads",
  authorizePermissions("leads.write"),
  asyncHandler(async (req, res) => {
    if (!isObject(req.body)) {
      throw new AppError(400, "Debes enviar un cuerpo JSON valido.", {
        code: "BODY_INVALID",
      });
    }

    const auth = getAuthContext(req);
    const data = await createLead(
      {
        nombre: readRequiredString(req.body.nombre, "nombre"),
        email: readRequiredString(req.body.email, "email"),
        telefono: readOptionalString(req.body.telefono) ?? null,
        empresa: readOptionalString(req.body.empresa) ?? null,
        mensaje: readRequiredString(req.body.mensaje, "mensaje"),
        areaPracticaId: readOptionalString(req.body.areaPracticaId) ?? null,
        origenUrl: readOptionalString(req.body.origenUrl) ?? null,
        asignadoAId: readOptionalString(req.body.asignadoAId) ?? null,
        estado:
          req.body.estado === undefined
            ? undefined
            : readEnumValue(req.body.estado, Object.values(EstadoLead), "estado"),
        esCompartido:
          readOptionalBoolean(req.body.esCompartido, "esCompartido") ?? false,
      },
      auth,
      getRequestMetadata(req),
    );

    res.status(201).json({
      ok: true,
      mensaje: "Lead registrado correctamente.",
      data,
    });
  }),
);

captacionRoutes.patch(
  "/leads/:leadId",
  authorizePermissions("leads.write"),
  asyncHandler(async (req, res) => {
    if (!isObject(req.body)) {
      throw new AppError(400, "Debes enviar un cuerpo JSON valido.", {
        code: "BODY_INVALID",
      });
    }

    const auth = getAuthContext(req);
    const data = await updateLead(
      readRequiredParam(req.params.leadId, "leadId"),
      {
        estado:
          req.body.estado === undefined
            ? undefined
            : readEnumValue(req.body.estado, Object.values(EstadoLead), "estado"),
        asignadoAId:
          req.body.asignadoAId === undefined
            ? undefined
            : readOptionalString(req.body.asignadoAId) ?? null,
        esCompartido:
          req.body.esCompartido === undefined
            ? undefined
            : readOptionalBoolean(req.body.esCompartido, "esCompartido"),
      },
      auth,
      getRequestMetadata(req),
    );

    res.json({
      ok: true,
      mensaje: "Lead actualizado correctamente.",
      data,
    });
  }),
);

captacionRoutes.post(
  "/leads/:leadId/convert",
  authorizePermissions("leads.write", "clientes.write"),
  asyncHandler(async (req, res) => {
    const auth = getAuthContext(req);
    const data = await convertLeadToCliente(
      readRequiredParam(req.params.leadId, "leadId"),
      auth,
      getRequestMetadata(req),
    );

    res.json({
      ok: true,
      mensaje: "Lead convertido correctamente en cliente.",
      data,
    });
  }),
);

export { captacionRoutes };

