import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { AppError } from "../errors/app-error.js";

export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  res.status(404).json({
    ok: false,
    mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof MulterError) {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "El archivo supera el limite permitido para la carga."
        : "No pudimos procesar el archivo enviado.";

    res.status(400).json({
      ok: false,
      mensaje: message,
      codigo: error.code,
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      ok: false,
      mensaje: error.message,
      codigo: error.code,
      detalle: error.details,
    });
    return;
  }

  console.error(error);

  res.status(500).json({
    ok: false,
    mensaje: "Ocurrio un error interno inesperado.",
    codigo: "INTERNAL_ERROR",
  });
}
