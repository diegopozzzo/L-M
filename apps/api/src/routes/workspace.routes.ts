import { Router } from "express";
import { EstadoAviso } from "../generated/prisma/enums.js";
import { AppError } from "../errors/app-error.js";
import {
  authenticate,
  authorizePermissions,
  getAuthContext,
} from "../middlewares/auth.js";
import {
  getDashboardOverview,
  listAvisos,
  listDocumentos,
  listEquipo,
  updateAvisoStatus,
} from "../modules/workspace/workspace.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { getRequestMetadata } from "../utils/request-metadata.js";

const workspaceRoutes = Router();

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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

workspaceRoutes.use(authenticate);

workspaceRoutes.get(
  "/dashboard/overview",
  authorizePermissions("expedientes.read"),
  asyncHandler(async (req, res) => {
    const auth = getAuthContext(req);
    const data = await getDashboardOverview(auth);

    res.json({
      ok: true,
      data,
    });
  }),
);

workspaceRoutes.get(
  "/documentos",
  authorizePermissions("documentos.read"),
  asyncHandler(async (req, res) => {
    const auth = getAuthContext(req);
    const data = await listDocumentos(auth);

    res.json({
      ok: true,
      data,
    });
  }),
);

workspaceRoutes.get(
  "/avisos",
  authorizePermissions("avisos.read"),
  asyncHandler(async (req, res) => {
    const auth = getAuthContext(req);
    const data = await listAvisos(auth);

    res.json({
      ok: true,
      data,
    });
  }),
);

workspaceRoutes.patch(
  "/avisos/:avisoId/estado",
  authorizePermissions("avisos.write"),
  asyncHandler(async (req, res) => {
    if (!isObject(req.body)) {
      throw new AppError(400, "Debes enviar un cuerpo JSON valido.", {
        code: "BODY_INVALID",
      });
    }

    const auth = getAuthContext(req);
    const data = await updateAvisoStatus(
      readRequiredParam(req.params.avisoId, "avisoId"),
      readEnumValue(req.body.estado, Object.values(EstadoAviso), "estado"),
      auth,
      getRequestMetadata(req),
    );

    res.json({
      ok: true,
      mensaje: "Aviso actualizado correctamente.",
      data,
    });
  }),
);

workspaceRoutes.get(
  "/equipo",
  authorizePermissions("usuarios.read"),
  asyncHandler(async (req, res) => {
    const auth = getAuthContext(req);
    const data = await listEquipo(auth);

    res.json({
      ok: true,
      data,
    });
  }),
);

export { workspaceRoutes };

