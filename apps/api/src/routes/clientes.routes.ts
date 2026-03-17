import { Router } from "express";
import {
  EstadoCliente,
  TipoPersona,
} from "../generated/prisma/enums.js";
import { AppError } from "../errors/app-error.js";
import {
  authenticate,
  authorizePermissions,
  getAuthContext,
} from "../middlewares/auth.js";
import {
  createCliente,
  listClientes,
} from "../modules/clientes/clientes.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { getRequestMetadata } from "../utils/request-metadata.js";

const clientesRoutes = Router();

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

clientesRoutes.use(authenticate);

clientesRoutes.get(
  "/",
  authorizePermissions("clientes.read"),
  asyncHandler(async (req, res) => {
    const auth = getAuthContext(req);
    const data = await listClientes(auth);

    res.json({
      ok: true,
      data,
    });
  }),
);

clientesRoutes.post(
  "/",
  authorizePermissions("clientes.write"),
  asyncHandler(async (req, res) => {
    if (!isObject(req.body)) {
      throw new AppError(400, "Debes enviar un cuerpo JSON valido.", {
        code: "BODY_INVALID",
      });
    }

    const auth = getAuthContext(req);
    const metadata = getRequestMetadata(req);
    const data = await createCliente(
      {
        tipoPersona: readEnumValue(req.body.tipoPersona, Object.values(TipoPersona), "tipoPersona"),
        nombresORazonSocial: readRequiredString(req.body.nombresORazonSocial, "nombresORazonSocial"),
        esCompartido: readOptionalBoolean(req.body.esCompartido, "esCompartido") ?? false,
        tipoDocumento: readOptionalString(req.body.tipoDocumento) ?? null,
        numeroDocumento: readOptionalString(req.body.numeroDocumento) ?? null,
        email: readOptionalString(req.body.email) ?? null,
        telefono: readOptionalString(req.body.telefono) ?? null,
        direccion: readOptionalString(req.body.direccion) ?? null,
        observaciones: readOptionalString(req.body.observaciones) ?? null,
      },
      auth,
      metadata,
    );

    res.status(201).json({
      ok: true,
      mensaje: "Cliente creado correctamente.",
      data,
    });
  }),
);

export { clientesRoutes };

