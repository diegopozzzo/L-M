"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, LoaderCircle, RefreshCcw, ShieldAlert } from "lucide-react";
import type { AvisoItemEnvelope, AvisosListEnvelope } from "@/lib/crm-ops";
import type { SessionUser } from "@/lib/auth";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function SummaryChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="crm-card rounded-2xl px-4 py-3 shadow-sm">
      <p className="crm-soft text-[0.7rem] font-semibold tracking-[0.16em] uppercase">{label}</p>
      <p className="crm-heading mt-2 font-display text-3xl">{value}</p>
    </div>
  );
}

type CrmAlertsPanelProps = {
  usuario: SessionUser;
};

export function CrmAlertsPanel({ usuario }: CrmAlertsPanelProps) {
  const canWrite = usuario.permisos.includes("avisos.write");
  const [filter, setFilter] = useState<"todos" | "pendientes" | "urgentes">("todos");
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
    items: NonNullable<AvisosListEnvelope["data"]>["items"];
    summary: NonNullable<AvisosListEnvelope["data"]>["summary"];
  }>({
    loading: true,
    error: null,
    items: [],
    summary: { total: 0, pendientes: 0, vencidos: 0, estaSemana: 0 },
  });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function loadAlerts() {
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const response = await fetch("/api/avisos", { method: "GET", cache: "no-store" });
      const payload = (await response.json()) as AvisosListEnvelope;

      if (!response.ok || !payload.ok || !payload.data) {
        setState({
          loading: false,
          error: payload.mensaje ?? "No pudimos cargar los avisos.",
          items: [],
          summary: { total: 0, pendientes: 0, vencidos: 0, estaSemana: 0 },
        });
        return;
      }

      setState({
        loading: false,
        error: null,
        items: payload.data.items,
        summary: payload.data.summary,
      });
    } catch {
      setState({
        loading: false,
        error: "No pudimos cargar los avisos.",
        items: [],
        summary: { total: 0, pendientes: 0, vencidos: 0, estaSemana: 0 },
      });
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAlerts();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const filteredItems = useMemo(() => {
    return state.items.filter((item) => {
      if (filter === "pendientes") {
        return item.estado === "PENDIENTE";
      }

      if (filter === "urgentes") {
        return item.diasRestantes <= 3 && item.estado === "PENDIENTE";
      }

      return true;
    });
  }, [filter, state.items]);

  async function updateAlertStatus(avisoId: string, estado: "COMPLETADO" | "CANCELADO") {
    setBusyId(avisoId);
    setFeedback(null);

    try {
      const response = await fetch(`/api/avisos/${avisoId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado }),
      });
      const payload = (await response.json()) as AvisoItemEnvelope;

      if (!response.ok || !payload.ok) {
        setFeedback(payload.mensaje ?? "No pudimos actualizar el aviso.");
        setBusyId(null);
        return;
      }

      setBusyId(null);
      setFeedback(payload.mensaje ?? "Aviso actualizado correctamente.");
      await loadAlerts();
    } catch {
      setBusyId(null);
      setFeedback("No pudimos actualizar el aviso.");
    }
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryChip label="Avisos" value={state.summary.total} />
        <SummaryChip label="Pendientes" value={state.summary.pendientes} />
        <SummaryChip label="Vencidos" value={state.summary.vencidos} />
        <SummaryChip label="Esta semana" value={state.summary.estaSemana} />
      </div>

      <article className="crm-card rounded-[1.8rem] p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="crm-heading text-lg font-semibold">Avisos y vencimientos</p>
            <p className="crm-muted mt-1 text-sm">Control operativo de plazos, audiencias y recordatorios del estudio.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[["todos", "Todos"], ["pendientes", "Pendientes"], ["urgentes", "Urgentes"]].map(([value, label]) => (
              <button key={value} type="button" onClick={() => setFilter(value as typeof filter)} className={`rounded-full px-4 py-2 text-sm transition-colors ${filter === value ? "bg-brand-navy text-white" : "bg-brand-surface text-brand-slate"}`}>
                {label}
              </button>
            ))}
            <button type="button" onClick={() => void loadAlerts()} className="crm-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors">
              <RefreshCcw className="size-4" />
              Recargar
            </button>
          </div>
        </div>
        {feedback ? <div className="crm-card-soft crm-muted mt-5 rounded-[1.2rem] px-4 py-3 text-sm">{feedback}</div> : null}
      </article>

      {state.loading ? (
        <article className="crm-card rounded-[1.8rem] px-6 py-16 text-center text-brand-slate">
          <LoaderCircle className="mx-auto size-6 animate-spin" />
          <p className="mt-4 text-sm">Cargando avisos...</p>
        </article>
      ) : state.error ? (
        <article className="crm-card rounded-[1.8rem] px-6 py-16 text-center text-brand-red">{state.error}</article>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredItems.map((item) => (
            <article key={item.id} className="crm-card rounded-[1.8rem] p-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-brand-amber-bg text-brand-amber">
                  <ShieldAlert className="size-5" />
                </div>
                <div>
                  <p className="crm-heading text-base font-semibold">{item.titulo}</p>
                  <p className="crm-muted text-sm">{item.expedienteNumero} · {item.cliente}</p>
                </div>
                <span className="crm-tag ml-auto inline-flex rounded-full px-3 py-1 text-xs font-semibold">{item.estado}</span>
              </div>
              <p className="crm-muted mt-4 text-sm leading-7">{item.descripcion ?? "Sin descripcion complementaria."}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="crm-card-soft rounded-[1.2rem] p-3 text-sm">
                  <p className="crm-soft text-xs uppercase">Vence</p>
                  <p className="crm-heading mt-1 font-semibold">{formatDate(item.fechaVencimiento)}</p>
                </div>
                <div className="crm-card-soft rounded-[1.2rem] p-3 text-sm">
                  <p className="crm-soft text-xs uppercase">Dias restantes</p>
                  <p className="crm-heading mt-1 font-semibold inline-flex items-center gap-2">
                    <Clock3 className="size-4 text-brand-copper" />
                    {item.diasRestantes}
                  </p>
                </div>
              </div>
              <p className="crm-soft mt-4 text-xs">Asignado a {item.asignadoA} · Prioridad {item.prioridad}</p>
              {canWrite && item.estado === "PENDIENTE" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" disabled={busyId === item.id} onClick={() => void updateAlertStatus(item.id, "COMPLETADO")} className="crm-button-primary rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-60">
                    {busyId === item.id ? "Procesando..." : "Marcar completado"}
                  </button>
                  <button type="button" disabled={busyId === item.id} onClick={() => void updateAlertStatus(item.id, "CANCELADO")} className="crm-button-secondary rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-60">
                    Cancelar
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

