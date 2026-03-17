import { Router } from "express";
import { captacionRoutes } from "./captacion.routes.js";
import { clientesRoutes } from "./clientes.routes.js";
import { authRoutes } from "./auth.routes.js";
import { expedientesRoutes } from "./expedientes.routes.js";
import { healthRoutes } from "./health.routes.js";
import { workspaceRoutes } from "./workspace.routes.js";

const apiRouter = Router();

apiRouter.use("/health", healthRoutes);
apiRouter.use("/auth", authRoutes);
apiRouter.use("/expedientes", expedientesRoutes);
apiRouter.use("/", captacionRoutes);
apiRouter.use("/clientes", clientesRoutes);
apiRouter.use("/", workspaceRoutes);

export { apiRouter };
