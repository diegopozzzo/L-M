import { Router } from "express";
import { env } from "../config/env.js";

const healthRoutes = Router();

// Punto de verificacion para desarrollo, despliegues y monitoreo.
healthRoutes.get("/", (_req, res) => {
  res.json({
    ok: true,
    servicio: env.APP_NAME,
    entorno: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

export { healthRoutes };
