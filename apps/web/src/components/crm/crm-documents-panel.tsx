"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, LoaderCircle, RefreshCcw, Search } from "lucide-react";
import type { DocumentosListEnvelope } from "@/lib/crm-ops";

function formatDate(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatBytes(value: number | null) {
  if (!value) {
    return "-";
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function SummaryChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="crm-card rounded-2xl px-4 py-3 shadow-sm">
      <p className="crm-soft text-[0.7rem] font-semibold tracking-[0.16em] uppercase">{label}</p>
      <p className="crm-heading mt-2 font-display text-3xl">{value}</p>
    </div>
  );
}

export function CrmDocumentsPanel() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"todos" | "POR_REVISAR" | "REVISADO" | "OBSERVADO">("todos");
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
    items: NonNullable<DocumentosListEnvelope["data"]>["items"];
    summary: NonNullable<DocumentosListEnvelope["data"]>["summary"];
  }>({
    loading: true,
    error: null,
    items: [],
    summary: { total: 0, porRevisar: 0, revisados: 0, observados: 0 },
  });

  async function loadDocuments() {
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const response = await fetch("/api/documentos", { method: "GET", cache: "no-store" });
      const payload = (await response.json()) as DocumentosListEnvelope;

      if (!response.ok || !payload.ok || !payload.data) {
        setState({
          loading: false,
          error: payload.mensaje ?? "No pudimos cargar los documentos.",
          items: [],
          summary: { total: 0, porRevisar: 0, revisados: 0, observados: 0 },
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
        error: "No pudimos cargar los documentos.",
        items: [],
        summary: { total: 0, porRevisar: 0, revisados: 0, observados: 0 },
      });
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDocuments();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const filteredItems = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return state.items.filter((item) => {
      const matchesFilter = filter === "todos" ? true : item.estadoRevision === filter;
      const matchesSearch =
        !normalized ||
        [item.nombreOriginal, item.cliente, item.expedienteNumero, item.tipoDocumento]
          .join(" ")
          .toLowerCase()
          .includes(normalized);

      return matchesFilter && matchesSearch;
    });
  }, [filter, search, state.items]);

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryChip label="Documentos" value={state.summary.total} />
        <SummaryChip label="Por revisar" value={state.summary.porRevisar} />
        <SummaryChip label="Revisados" value={state.summary.revisados} />
        <SummaryChip label="Observados" value={state.summary.observados} />
      </div>

      <article className="crm-card rounded-[1.8rem] p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="crm-heading text-lg font-semibold">Repositorio documental</p>
            <p className="crm-muted mt-1 text-sm">Consulta piezas subidas, su estado de revision y descargas del expediente.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="crm-input flex min-w-[18rem] items-center gap-2 rounded-full px-4 py-3 text-sm">
              <Search className="size-4" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar documento o expediente" className="w-full bg-transparent outline-none" />
            </label>
            <button type="button" onClick={() => void loadDocuments()} className="crm-button-secondary inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium transition-colors">
              <RefreshCcw className="size-4" />
              Recargar
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {[
            ["todos", "Todos"],
            ["POR_REVISAR", "Por revisar"],
            ["REVISADO", "Revisados"],
            ["OBSERVADO", "Observados"],
          ].map(([value, label]) => (
            <button key={value} type="button" onClick={() => setFilter(value as typeof filter)} className={`rounded-full px-4 py-2 text-sm transition-colors ${filter === value ? "bg-brand-navy text-white" : "bg-brand-surface text-brand-slate"}`}>
              {label}
            </button>
          ))}
        </div>
      </article>

      <article className="crm-card overflow-hidden rounded-[1.8rem]">
        <div className="border-b border-[var(--crm-divider)] px-5 py-4">
          <p className="crm-heading text-lg font-semibold">Listado documental</p>
          <p className="crm-muted text-sm">{filteredItems.length} archivo(s) en la vista actual</p>
        </div>
        {state.loading ? (
          <div className="flex items-center justify-center px-6 py-16 text-brand-slate">
            <LoaderCircle className="mr-3 size-5 animate-spin" />
            Cargando documentos...
          </div>
        ) : state.error ? (
          <div className="px-6 py-12 text-center text-sm text-brand-red">{state.error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="crm-table-head">
                  {["Documento", "Expediente", "Cliente", "Tipo", "Estado", "Fecha", "Tamano", "Accion"].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-[0.64rem] font-semibold tracking-[0.16em] uppercase">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="crm-table-row border-t border-[var(--crm-divider)] align-top">
                    <td className="px-4 py-4">
                      <p className="crm-heading text-sm font-semibold">{item.nombreOriginal}</p>
                      <p className="crm-muted mt-1 text-xs">{item.descripcionInterna ?? "Sin nota interna"}</p>
                    </td>
                    <td className="px-4 py-4 text-sm crm-muted">{item.expedienteNumero}<br />{item.expedienteTitulo}</td>
                    <td className="px-4 py-4 text-sm crm-muted">{item.cliente}</td>
                    <td className="px-4 py-4 text-sm crm-muted">{item.tipoDocumento}</td>
                    <td className="px-4 py-4 text-sm"><span className="crm-tag inline-flex rounded-full px-3 py-1 text-xs font-semibold">{item.estadoRevision.replaceAll("_", " ")}</span></td>
                    <td className="px-4 py-4 text-sm crm-muted">{formatDate(item.fechaDocumento ?? item.updatedAt)}</td>
                    <td className="px-4 py-4 text-sm crm-muted">{formatBytes(item.tamanoBytes)}</td>
                    <td className="px-4 py-4">
                      <a href={`/api/expedientes/${item.expedienteId}/documentos/${item.id}/descarga`} className="crm-button-secondary inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-colors">
                        <Download className="size-3.5" />
                        Descargar
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}

