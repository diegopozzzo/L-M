"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, RefreshCcw, Search } from "lucide-react";
import type { EquipoListEnvelope } from "@/lib/crm-ops";

function formatDate(value: string | null) {
  if (!value) {
    return "Sin registro";
  }

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

export function CrmTeamPanel() {
  const [search, setSearch] = useState("");
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
    items: NonNullable<EquipoListEnvelope["data"]>["items"];
    summary: NonNullable<EquipoListEnvelope["data"]>["summary"];
  }>({
    loading: true,
    error: null,
    items: [],
    summary: { total: 0, socios: 0, abogados: 0, asistentes: 0 },
  });

  async function loadTeam() {
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const response = await fetch("/api/equipo", { method: "GET", cache: "no-store" });
      const payload = (await response.json()) as EquipoListEnvelope;

      if (!response.ok || !payload.ok || !payload.data) {
        setState({
          loading: false,
          error: payload.mensaje ?? "No pudimos cargar el equipo.",
          items: [],
          summary: { total: 0, socios: 0, abogados: 0, asistentes: 0 },
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
        error: "No pudimos cargar el equipo.",
        items: [],
        summary: { total: 0, socios: 0, abogados: 0, asistentes: 0 },
      });
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTeam();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const filteredItems = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) {
      return state.items;
    }

    return state.items.filter((item) =>
      [item.nombreCompleto, item.email, item.rol].join(" ").toLowerCase().includes(normalized),
    );
  }, [search, state.items]);

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryChip label="Equipo" value={state.summary.total} />
        <SummaryChip label="Socios" value={state.summary.socios} />
        <SummaryChip label="Abogados" value={state.summary.abogados} />
        <SummaryChip label="Asistentes" value={state.summary.asistentes} />
      </div>

      <article className="crm-card rounded-[1.8rem] p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="crm-heading text-lg font-semibold">Equipo juridico</p>
            <p className="crm-muted mt-1 text-sm">Carga operativa, ultimo acceso y contribucion documental por perfil.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="crm-input flex min-w-[18rem] items-center gap-2 rounded-full px-4 py-3 text-sm">
              <Search className="size-4" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar persona o rol" className="w-full bg-transparent outline-none" />
            </label>
            <button type="button" onClick={() => void loadTeam()} className="crm-button-secondary inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium transition-colors">
              <RefreshCcw className="size-4" />
              Recargar
            </button>
          </div>
        </div>
      </article>

      {state.loading ? (
        <article className="crm-card rounded-[1.8rem] px-6 py-16 text-center text-brand-slate">
          <LoaderCircle className="mx-auto size-6 animate-spin" />
          <p className="mt-4 text-sm">Cargando equipo...</p>
        </article>
      ) : state.error ? (
        <article className="crm-card rounded-[1.8rem] px-6 py-16 text-center text-brand-red">{state.error}</article>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredItems.map((item) => (
            <article key={item.id} className="crm-card rounded-[1.8rem] p-5">
              <div className="flex items-start gap-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-brand-blue-bg text-sm font-semibold text-brand-blue">
                  {item.nombreCompleto
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="crm-heading truncate text-base font-semibold">{item.nombreCompleto}</p>
                  <p className="crm-muted truncate text-sm">{item.rol} · {item.email}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="crm-card-soft rounded-[1.2rem] p-3">
                  <p className="crm-soft text-xs uppercase">Expedientes</p>
                  <p className="crm-heading mt-1 font-semibold">{item.expedientesActivos}</p>
                </div>
                <div className="crm-card-soft rounded-[1.2rem] p-3">
                  <p className="crm-soft text-xs uppercase">Avisos</p>
                  <p className="crm-heading mt-1 font-semibold">{item.avisosPendientes}</p>
                </div>
                <div className="crm-card-soft rounded-[1.2rem] p-3">
                  <p className="crm-soft text-xs uppercase">Documentos</p>
                  <p className="crm-heading mt-1 font-semibold">{item.documentosSubidos}</p>
                </div>
              </div>
              <p className="crm-soft mt-4 text-xs">Ultimo acceso: {formatDate(item.ultimoAcceso)} · {item.telefono ?? "Sin telefono"}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

