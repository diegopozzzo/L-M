"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { CrmDashboard } from "@/components/crm/crm-dashboard";
import type { SessionEnvelope, SessionUser } from "@/lib/auth";

type SessionState =
  | { status: "loading" }
  | { status: "ready"; user: SessionUser }
  | { status: "error"; message: string };

export function CrmWorkspace() {
  const router = useRouter();
  const [sessionState, setSessionState] = useState<SessionState>({
    status: "loading",
  });
  const [loggingOut, setLoggingOut] = useState(false);

  const loadSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json()) as SessionEnvelope;

      if (!response.ok || !payload.ok || !payload.data?.user) {
        router.replace("/acceso");
        return;
      }

      setSessionState({
        status: "ready",
        user: payload.data.user,
      });
    } catch {
      setSessionState({
        status: "error",
        message:
          "No pudimos validar tu sesion. Reintenta o vuelve a ingresar al area privada.",
      });
    }
  }, [router]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);

    try {
      await fetch("/api/auth/session", {
        method: "DELETE",
      });
    } finally {
      router.replace("/acceso");
      router.refresh();
    }
  }, [router]);

  if (sessionState.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="crm-card w-full max-w-xl rounded-[2rem] px-8 py-12 text-center">
          <LoaderCircle className="mx-auto size-10 animate-spin text-brand-green" />
          <p className="crm-soft mt-6 text-xs font-semibold tracking-[0.28em] uppercase">
            Validando sesion
          </p>
          <h1 className="crm-heading mt-4 font-display text-4xl">
            Preparando tu espacio de trabajo
          </h1>
          <p className="crm-muted mt-4 text-sm leading-7">
            Estamos verificando permisos y actualizando la sesion del estudio.
          </p>
        </div>
      </div>
    );
  }

  if (sessionState.status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="crm-card w-full max-w-xl rounded-[2rem] px-8 py-12 text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-brand-red uppercase">
            Sesion no disponible
          </p>
          <h1 className="crm-heading mt-4 font-display text-4xl">
            No pudimos abrir el area privada
          </h1>
          <p className="crm-muted mt-4 text-sm leading-7">
            {sessionState.message}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => void loadSession()}
              className="crm-button-primary rounded-full px-5 py-3 text-sm font-semibold transition-colors"
            >
              Reintentar
            </button>
            <button
              type="button"
              onClick={() => router.replace("/acceso")}
              className="crm-button-secondary rounded-full px-5 py-3 text-sm font-semibold transition-colors"
            >
              Volver al acceso
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CrmDashboard
      usuario={sessionState.user}
      isLoggingOut={loggingOut}
      onLogout={() => void handleLogout()}
    />
  );
}
