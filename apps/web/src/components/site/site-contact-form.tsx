"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";
import type {
  ContactCatalogoEnvelope,
  PublicContactPayload,
} from "@/lib/crm-ops";

const inputClassName =
  "site-input w-full rounded-2xl px-4 py-3 text-sm outline-none transition-colors";

type SubmitState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function SiteContactForm() {
  const [catalogoState, setCatalogoState] = useState<{
    loading: boolean;
    error: string | null;
    areas: Array<{ id: string; nombre: string }>;
  }>({
    loading: true,
    error: null,
    areas: [],
  });
  const [form, setForm] = useState<PublicContactPayload>({
    nombre: "",
    email: "",
    telefono: "",
    empresa: "",
    mensaje: "",
    areaPracticaId: "",
  });
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });

  useEffect(() => {
    let mounted = true;

    async function loadCatalogo() {
      try {
        const response = await fetch("/api/contacto/catalogo", {
          method: "GET",
          cache: "no-store",
        });
        const payload = (await response.json()) as ContactCatalogoEnvelope;

        if (!mounted) {
          return;
        }

        if (!response.ok || !payload.ok || !payload.data) {
          setCatalogoState({
            loading: false,
            error: payload.mensaje ?? "No pudimos cargar las areas disponibles.",
            areas: [],
          });
          return;
        }

        setCatalogoState({
          loading: false,
          error: null,
          areas: payload.data.areasPractica.map((area) => ({
            id: area.id,
            nombre: area.nombre,
          })),
        });
      } catch {
        if (!mounted) {
          return;
        }

        setCatalogoState({
          loading: false,
          error: "No pudimos cargar las areas disponibles.",
          areas: [],
        });
      }
    }

    void loadCatalogo();

    return () => {
      mounted = false;
    };
  }, []);

  const submitDisabled = submitState.status === "loading";
  const helperMessage = useMemo(() => {
    if (catalogoState.error) {
      return catalogoState.error;
    }

    if (submitState.status === "success" || submitState.status === "error") {
      return submitState.message;
    }

    return "Te responderemos con un primer criterio y la mejor ruta para continuar.";
  }, [catalogoState.error, submitState]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState({ status: "loading" });

    try {
      const response = await fetch("/api/contacto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          areaPracticaId: form.areaPracticaId || undefined,
          origenUrl: window.location.pathname,
        }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        mensaje?: string;
      };

      if (!response.ok || !payload.ok) {
        setSubmitState({
          status: "error",
          message: payload.mensaje ?? "No pudimos enviar tu consulta.",
        });
        return;
      }

      setForm({
        nombre: "",
        email: "",
        telefono: "",
        empresa: "",
        mensaje: "",
        areaPracticaId: catalogoState.areas[0]?.id ?? "",
      });
      setSubmitState({
        status: "success",
        message: payload.mensaje ?? "Recibimos tu consulta correctamente.",
      });
    } catch {
      setSubmitState({
        status: "error",
        message: "No pudimos enviar tu consulta en este momento.",
      });
    }
  }

  return (
    <form className="site-panel rounded-[2rem] p-8" onSubmit={handleSubmit}>
      <p className="site-kicker text-xs font-semibold site-text-kicker">
        Formulario inicial
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input
          required
          value={form.nombre}
          onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))}
          className={inputClassName}
          placeholder="Nombre completo"
        />
        <input
          required
          type="email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          className={inputClassName}
          placeholder="Correo corporativo"
        />
        <input
          value={form.telefono}
          onChange={(event) => setForm((current) => ({ ...current, telefono: event.target.value }))}
          className={inputClassName}
          placeholder="Telefono"
        />
        <input
          value={form.empresa}
          onChange={(event) => setForm((current) => ({ ...current, empresa: event.target.value }))}
          className={inputClassName}
          placeholder="Empresa"
        />
      </div>
      <div className="mt-4">
        <select
          value={form.areaPracticaId}
          onChange={(event) =>
            setForm((current) => ({ ...current, areaPracticaId: event.target.value }))
          }
          className={inputClassName}
          disabled={catalogoState.loading}
        >
          <option value="">Selecciona un frente legal</option>
          {catalogoState.areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-4">
        <textarea
          required
          value={form.mensaje}
          onChange={(event) => setForm((current) => ({ ...current, mensaje: event.target.value }))}
          className={`${inputClassName} min-h-40 resize-none`}
          placeholder="Cuadro breve del asunto, urgencia y contexto."
        />
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-6 text-sm">
          {submitState.status === "success" ? (
            <span className="inline-flex items-center gap-2 text-brand-green">
              <CheckCircle2 className="size-4" />
              {helperMessage}
            </span>
          ) : (
            <span
              className={
                submitState.status === "error" ? "text-brand-red" : "site-text-muted"
              }
            >
              {helperMessage}
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={submitDisabled}
          className="site-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitState.status === "loading" ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Enviando consulta
            </>
          ) : (
            <>
              Enviar consulta
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

