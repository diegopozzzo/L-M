"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LoaderCircle,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Shield,
  X,
} from "lucide-react";
import { CrmExpedienteDetailPanel } from "@/components/crm/crm-expediente-detail-panel";
import { CrmStatusBadge } from "@/components/crm/crm-status-badge";
import type { SessionUser } from "@/lib/auth";
import type {
  ExpedienteCatalogo,
  ExpedienteCreatePayload,
  ExpedienteDetalle,
  ExpedienteDetalleEnvelope,
  ExpedienteDocumentUpdatePayload,
  ExpedienteEstadoInterno,
  ExpedienteListItem,
  ExpedienteNoteCreatePayload,
  ExpedienteSummary,
  ExpedienteWorkspacePayload,
} from "@/lib/crm-expedientes";

type FilterType = "todos" | "activos" | "pendientes" | "urgentes" | "cerrados";

type CreateResult = {
  ok: boolean;
  mensaje?: string;
};

type UpdateStatusResult = {
  ok: boolean;
  mensaje?: string;
};

type CrmExpedientesPanelProps = {
  usuario: SessionUser;
  items: ExpedienteListItem[];
  summary: ExpedienteSummary;
  catalogo: ExpedienteCatalogo | null;
  loading: boolean;
  error: string | null;
  composerVersion: number;
  onRefresh: () => void;
  onCreate: (payload: ExpedienteCreatePayload) => Promise<CreateResult>;
  onUpdateEstado: (
    expedienteId: string,
    estado: ExpedienteEstadoInterno,
  ) => Promise<UpdateStatusResult>;
};

type ExpedienteFormState = {
  codigoInterno: string;
  clienteId: string;
  areaPracticaId: string;
  responsableId: string;
  titulo: string;
  descripcion: string;
  contraparte: string;
  organoJudicial: string;
  numeroExpedienteExterno: string;
  prioridad: ExpedienteCreatePayload["prioridad"];
  nivelConfidencialidad: ExpedienteCreatePayload["nivelConfidencialidad"];
};

const estadoInternoLabels: Record<ExpedienteEstadoInterno, string> = {
  ABIERTO: "Abierto",
  EN_PROCESO: "En proceso",
  EN_ESPERA: "En espera",
  CERRADO: "Cerrado",
  ARCHIVADO: "Archivado",
};

const prioridadLabels = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
  CRITICA: "Critica",
} as const;

const confidencialidadLabels = {
  BAJO: "Bajo",
  MEDIO: "Medio",
  ALTO: "Alto",
  RESTRINGIDO: "Restringido",
} as const;

function formatDateLabel(value: string | null) {
  if (!value) {
    return "Sin movimiento";
  }

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function buildInitialForm(
  catalogo: ExpedienteCatalogo | null,
  usuario: SessionUser,
): ExpedienteFormState {
  const responsableActual =
    catalogo?.responsables.find((item) => item.id === usuario.id)?.id ??
    catalogo?.responsables[0]?.id ??
    "";

  return {
    codigoInterno: "",
    clienteId: catalogo?.clientes[0]?.id ?? "",
    areaPracticaId: catalogo?.areasPractica[0]?.id ?? "",
    responsableId: responsableActual,
    titulo: "",
    descripcion: "",
    contraparte: "",
    organoJudicial: "",
    numeroExpedienteExterno: "",
    prioridad: "MEDIA",
    nivelConfidencialidad: "ALTO",
  };
}

function SummaryChip({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="crm-card rounded-2xl px-4 py-3 shadow-sm">
      <p className="crm-soft text-[0.7rem] font-semibold tracking-[0.16em] uppercase">
        {label}
      </p>
      <p className="crm-heading mt-2 font-display text-3xl">{value}</p>
    </div>
  );
}

export function CrmExpedientesPanel({
  usuario,
  items,
  summary,
  catalogo,
  loading,
  error,
  composerVersion,
  onRefresh,
  onCreate,
  onUpdateEstado,
}: CrmExpedientesPanelProps) {
  const canCreate = usuario.permisos.includes("expedientes.write");
  const [filter, setFilter] = useState<FilterType>("todos");
  const [search, setSearch] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [form, setForm] = useState<ExpedienteFormState>(() =>
    buildInitialForm(catalogo, usuario),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusDrafts, setStatusDrafts] = useState<
    Record<string, ExpedienteEstadoInterno>
  >({});
  const [selectedExpedienteId, setSelectedExpedienteId] = useState<string | null>(
    null,
  );
  const [detailState, setDetailState] = useState<{
    data: ExpedienteDetalle | null;
    loading: boolean;
    error: string | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });

  const handleOpenComposer = useCallback(() => {
    setForm(buildInitialForm(catalogo, usuario));
    setFormError(null);
    setComposerOpen(true);
  }, [catalogo, usuario]);

  const handleCloseComposer = useCallback(() => {
    setComposerOpen(false);
    setFormError(null);
  }, []);

  useEffect(() => {
    if (composerVersion > 0 && canCreate) {
      const timer = window.setTimeout(() => {
        handleOpenComposer();
      }, 0);

      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [canCreate, composerVersion, handleOpenComposer]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesFilter =
        filter === "todos"
          ? true
          : filter === "activos"
            ? item.estadoVista === "ACTIVO"
            : filter === "pendientes"
              ? item.estadoVista === "PENDIENTE"
              : filter === "urgentes"
                ? item.estadoVista === "URGENTE"
                : item.estadoVista === "CERRADO";

      if (!matchesFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        item.numero,
        item.titulo,
        item.cliente,
        item.materia,
        item.abogado,
        item.contraparte ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [filter, items, search]);

  const activeExpedienteId =
    selectedExpedienteId && items.some((item) => item.id === selectedExpedienteId)
      ? selectedExpedienteId
      : items[0]?.id ?? null;

  const loadDetail = useCallback(async (expedienteId: string) => {
    setDetailState({
      data: null,
      loading: true,
      error: null,
    });

    try {
      const response = await fetch(`/api/expedientes/${expedienteId}/detalle`, {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json()) as ExpedienteDetalleEnvelope;

      if (!response.ok || !payload.ok || !payload.data) {
        setDetailState({
          data: null,
          loading: false,
          error:
            payload.mensaje ?? "No pudimos cargar la ficha del expediente.",
        });
        return;
      }

      setDetailState({
        data: payload.data,
        loading: false,
        error: null,
      });
    } catch {
      setDetailState({
        data: null,
        loading: false,
        error: "No pudimos cargar la ficha del expediente.",
      });
    }
  }, []);

  useEffect(() => {
    if (!activeExpedienteId) {
      return;
    }

    if (
      !detailState.data ||
      detailState.data.expediente.id !== activeExpedienteId
    ) {
      const timer = window.setTimeout(() => {
        void loadDetail(activeExpedienteId);
      }, 0);

      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [activeExpedienteId, detailState.data, loadDetail]);

  const resolvedDetail = activeExpedienteId ? detailState.data : null;
  const resolvedDetailLoading = activeExpedienteId ? detailState.loading : false;
  const resolvedDetailError = activeExpedienteId ? detailState.error : null;

  const handleRefreshDetail = useCallback(() => {
    if (!activeExpedienteId) {
      return;
    }

    void loadDetail(activeExpedienteId);
  }, [activeExpedienteId, loadDetail]);

  const handleSaveWorkspace = useCallback(
    async (payload: ExpedienteWorkspacePayload) => {
      if (!activeExpedienteId) {
        return {
          ok: false,
          mensaje: "Selecciona un expediente antes de guardar su ficha.",
        };
      }

      try {
        const response = await fetch(
          `/api/expedientes/${activeExpedienteId}/detalle`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        );
        const result = (await response.json()) as ExpedienteDetalleEnvelope;

        if (!response.ok || !result.ok || !result.data) {
          return {
            ok: false,
            mensaje: result.mensaje ?? "No pudimos actualizar la ficha.",
          };
        }

        setDetailState({
          data: result.data,
          loading: false,
          error: null,
        });
        await onRefresh();

        return {
          ok: true,
          mensaje: "Ficha del expediente actualizada correctamente.",
        };
      } catch {
        return {
          ok: false,
          mensaje: "No pudimos actualizar la ficha.",
        };
      }
    },
    [activeExpedienteId, onRefresh],
  );

  const handleCreateNote = useCallback(
    async (payload: ExpedienteNoteCreatePayload) => {
      if (!activeExpedienteId) {
        return {
          ok: false,
          mensaje: "Selecciona un expediente antes de registrar una nota.",
        };
      }

      try {
        const response = await fetch(
          `/api/expedientes/${activeExpedienteId}/notas`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        );
        const result = (await response.json()) as { ok: boolean; mensaje?: string };

        if (!response.ok || !result.ok) {
          return {
            ok: false,
            mensaje: result.mensaje ?? "No pudimos registrar la nota.",
          };
        }

        await loadDetail(activeExpedienteId);

        return {
          ok: true,
          mensaje: result.mensaje ?? "Nota registrada correctamente.",
        };
      } catch {
        return {
          ok: false,
          mensaje: "No pudimos registrar la nota.",
        };
      }
    },
    [activeExpedienteId, loadDetail],
  );

  const handleUploadDocument = useCallback(
    async (payload: FormData) => {
      if (!activeExpedienteId) {
        return {
          ok: false,
          mensaje: "Selecciona un expediente antes de cargar un documento.",
        };
      }

      try {
        const response = await fetch(
          `/api/expedientes/${activeExpedienteId}/documentos`,
          {
            method: "POST",
            body: payload,
          },
        );
        const result = (await response.json()) as { ok: boolean; mensaje?: string };

        if (!response.ok || !result.ok) {
          return {
            ok: false,
            mensaje: result.mensaje ?? "No pudimos cargar el documento.",
          };
        }

        await Promise.all([loadDetail(activeExpedienteId), onRefresh()]);

        return {
          ok: true,
          mensaje: result.mensaje ?? "Documento cargado correctamente.",
        };
      } catch {
        return {
          ok: false,
          mensaje: "No pudimos cargar el documento.",
        };
      }
    },
    [activeExpedienteId, loadDetail, onRefresh],
  );

  const handleUpdateDocument = useCallback(
    async (
      documentoId: string,
      payload: ExpedienteDocumentUpdatePayload,
    ) => {
      if (!activeExpedienteId) {
        return {
          ok: false,
          mensaje: "Selecciona un expediente antes de actualizar documentos.",
        };
      }

      try {
        const response = await fetch(
          `/api/expedientes/${activeExpedienteId}/documentos/${documentoId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        );
        const result = (await response.json()) as { ok: boolean; mensaje?: string };

        if (!response.ok || !result.ok) {
          return {
            ok: false,
            mensaje: result.mensaje ?? "No pudimos actualizar el documento.",
          };
        }

        await loadDetail(activeExpedienteId);

        return {
          ok: true,
          mensaje: result.mensaje ?? "Documento actualizado correctamente.",
        };
      } catch {
        return {
          ok: false,
          mensaje: "No pudimos actualizar el documento.",
        };
      }
    },
    [activeExpedienteId, loadDetail],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const result = await onCreate({
      codigoInterno: form.codigoInterno.trim(),
      clienteId: form.clienteId,
      areaPracticaId: form.areaPracticaId,
      responsableId: form.responsableId,
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim() || undefined,
      contraparte: form.contraparte.trim() || undefined,
      organoJudicial: form.organoJudicial.trim() || undefined,
      numeroExpedienteExterno: form.numeroExpedienteExterno.trim() || undefined,
      prioridad: form.prioridad,
      nivelConfidencialidad: form.nivelConfidencialidad,
    });

    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.mensaje ?? "No pudimos crear el expediente.");
      return;
    }

    handleCloseComposer();
    setForm(buildInitialForm(catalogo, usuario));
  }

  async function handleStatusUpdate(
    expedienteId: string,
    estado: ExpedienteEstadoInterno,
  ) {
    setUpdatingId(expedienteId);
    const result = await onUpdateEstado(expedienteId, estado);
    setUpdatingId(null);

    if (!result.ok) {
      setFormError(result.mensaje ?? "No pudimos actualizar el estado.");
      return;
    }

    setStatusDrafts((current) => {
      const next = { ...current };
      delete next[expedienteId];
      return next;
    });
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryChip label="Visibles" value={summary.total} />
        <SummaryChip label="Activos" value={summary.activos} />
        <SummaryChip label="Pendientes" value={summary.pendientes} />
        <SummaryChip label="Urgentes" value={summary.urgentes} />
        <SummaryChip label="Cerrados" value={summary.cerrados} />
      </div>

      <article id="crm-tour-expedientes-workspace" className="crm-card rounded-[1.8rem] p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="crm-heading text-lg font-semibold">
              Gestion operativa de expedientes
            </p>
            <p className="crm-muted mt-1 text-sm">
              Consulta, filtra, crea y actualiza casos con trazabilidad interna.
            </p>
          </div>

          <div id="crm-tour-expediente-actions" className="flex flex-col gap-3 sm:flex-row">
            <label className="crm-input flex min-w-[18rem] items-center gap-2 rounded-full px-4 py-3 text-sm">
              <Search className="size-4" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por codigo, cliente o materia"
                className="w-full bg-transparent outline-none"
              />
            </label>

            <button
              type="button"
              onClick={onRefresh}
              className="crm-button-secondary inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium transition-colors"
            >
              <RefreshCcw className="size-4" />
              Recargar
            </button>

            {canCreate ? (
              <button
                type="button"
                onClick={() => {
                  if (composerOpen) {
                    handleCloseComposer();
                    return;
                  }

                  handleOpenComposer();
                }}
                className="crm-button-primary inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-colors"
              >
                <Plus className="size-4" />
                {composerOpen ? "Cerrar formulario" : "Nuevo expediente"}
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {[
            ["todos", "Todos"],
            ["activos", "Activos"],
            ["pendientes", "Pendientes"],
            ["urgentes", "Urgentes"],
            ["cerrados", "Cerrados"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value as FilterType)}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                filter === value
                  ? "bg-brand-navy text-white"
                  : "bg-brand-surface text-brand-slate"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {composerOpen ? (
          <form
            className="mt-6 rounded-[1.6rem] border border-brand-navy/8 bg-brand-offwhite/70 p-5"
            onSubmit={handleSubmit}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-brand-navy">
                  Alta rapida de expediente
                </p>
                <p className="mt-1 text-sm text-brand-slate">
                  Completa los datos esenciales para abrir el caso y asignar un responsable.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseComposer}
                className="rounded-full border border-brand-navy/10 p-2 text-brand-slate transition-colors hover:bg-white"
                aria-label="Cerrar formulario"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.16em] text-brand-slate-light uppercase">
                  Codigo interno
                </span>
                <input
                  required
                  value={form.codigoInterno}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      codigoInterno: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-brand-navy/10 bg-white px-4 py-3 text-sm text-brand-navy outline-none transition-colors focus:border-brand-green"
                  placeholder="EXP-2026-010"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.16em] text-brand-slate-light uppercase">
                  Cliente
                </span>
                <select
                  required
                  value={form.clienteId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      clienteId: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-brand-navy/10 bg-white px-4 py-3 text-sm text-brand-navy outline-none transition-colors focus:border-brand-green"
                >
                  {catalogo?.clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.16em] text-brand-slate-light uppercase">
                  Area
                </span>
                <select
                  required
                  value={form.areaPracticaId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      areaPracticaId: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-brand-navy/10 bg-white px-4 py-3 text-sm text-brand-navy outline-none transition-colors focus:border-brand-green"
                >
                  {catalogo?.areasPractica.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.16em] text-brand-slate-light uppercase">
                  Responsable
                </span>
                <select
                  required
                  value={form.responsableId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      responsableId: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-brand-navy/10 bg-white px-4 py-3 text-sm text-brand-navy outline-none transition-colors focus:border-brand-green"
                >
                  {catalogo?.responsables.map((responsable) => (
                    <option key={responsable.id} value={responsable.id}>
                      {responsable.nombreCompleto} - {responsable.rol}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 md:col-span-2 xl:col-span-2">
                <span className="text-xs font-semibold tracking-[0.16em] text-brand-slate-light uppercase">
                  Titulo del caso
                </span>
                <input
                  required
                  value={form.titulo}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      titulo: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-brand-navy/10 bg-white px-4 py-3 text-sm text-brand-navy outline-none transition-colors focus:border-brand-green"
                  placeholder="Describe el asunto principal"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.16em] text-brand-slate-light uppercase">
                  Prioridad
                </span>
                <select
                  value={form.prioridad}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      prioridad: event.target
                        .value as ExpedienteFormState["prioridad"],
                    }))
                  }
                  className="w-full rounded-2xl border border-brand-navy/10 bg-white px-4 py-3 text-sm text-brand-navy outline-none transition-colors focus:border-brand-green"
                >
                  {catalogo?.opciones.prioridades.map((prioridad) => (
                    <option key={prioridad} value={prioridad}>
                      {prioridadLabels[prioridad]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.16em] text-brand-slate-light uppercase">
                  Confidencialidad
                </span>
                <select
                  value={form.nivelConfidencialidad}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      nivelConfidencialidad: event.target
                        .value as ExpedienteFormState["nivelConfidencialidad"],
                    }))
                  }
                  className="w-full rounded-2xl border border-brand-navy/10 bg-white px-4 py-3 text-sm text-brand-navy outline-none transition-colors focus:border-brand-green"
                >
                  {catalogo?.opciones.nivelesConfidencialidad.map((nivel) => (
                    <option key={nivel} value={nivel}>
                      {confidencialidadLabels[nivel]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.16em] text-brand-slate-light uppercase">
                  Expediente externo
                </span>
                <input
                  value={form.numeroExpedienteExterno}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      numeroExpedienteExterno: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-brand-navy/10 bg-white px-4 py-3 text-sm text-brand-navy outline-none transition-colors focus:border-brand-green"
                  placeholder="LAB-2026-082"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.16em] text-brand-slate-light uppercase">
                  Contraparte
                </span>
                <input
                  value={form.contraparte}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      contraparte: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-brand-navy/10 bg-white px-4 py-3 text-sm text-brand-navy outline-none transition-colors focus:border-brand-green"
                  placeholder="Entidad o contraparte principal"
                />
              </label>

              <label className="space-y-2 md:col-span-2 xl:col-span-2">
                <span className="text-xs font-semibold tracking-[0.16em] text-brand-slate-light uppercase">
                  Organo o instancia
                </span>
                <input
                  value={form.organoJudicial}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      organoJudicial: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-brand-navy/10 bg-white px-4 py-3 text-sm text-brand-navy outline-none transition-colors focus:border-brand-green"
                  placeholder="Juzgado, sala, arbitraje o gestion administrativa"
                />
              </label>

              <label className="space-y-2 md:col-span-2 xl:col-span-4">
                <span className="text-xs font-semibold tracking-[0.16em] text-brand-slate-light uppercase">
                  Descripcion breve
                </span>
                <textarea
                  value={form.descripcion}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      descripcion: event.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full rounded-[1.4rem] border border-brand-navy/10 bg-white px-4 py-3 text-sm leading-7 text-brand-navy outline-none transition-colors focus:border-brand-green"
                  placeholder="Contexto legal, objetivo del caso y notas iniciales."
                />
              </label>
            </div>

            {formError ? (
              <div className="mt-4 rounded-[1.1rem] border border-brand-red/18 bg-brand-red-bg px-4 py-3 text-sm text-brand-red">
                {formError}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-xs text-brand-slate-light">
                <Shield className="size-4" />
                El alta genera trazabilidad y asigna un responsable principal.
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Crear expediente
                  </>
                )}
              </button>
            </div>
          </form>
        ) : null}
      </article>

      <article id="crm-tour-expediente-list" className="crm-card overflow-hidden rounded-[1.8rem]">
        <div className="border-b border-black/5 px-5 py-4">
          <p className="text-lg font-semibold text-brand-navy">
            Listado operativo
          </p>
          <p className="text-sm text-brand-slate">
            {filteredItems.length} expediente(s) en la vista actual
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center px-6 py-16 text-brand-slate">
            <LoaderCircle className="mr-3 size-5 animate-spin" />
            Cargando expedientes...
          </div>
        ) : error ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-brand-red">{error}</p>
            <button
              type="button"
              onClick={onRefresh}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-brand-navy/10 px-4 py-2 text-sm text-brand-slate transition-colors hover:bg-brand-surface"
            >
              <RefreshCcw className="size-4" />
              Reintentar
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-display text-4xl text-brand-navy">
              Aun no hay expedientes en esta vista
            </p>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-brand-slate">
              Ajusta filtros, cambia la busqueda o crea un nuevo expediente para comenzar.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-brand-offwhite">
                  {[
                    "Codigo",
                    "Caso",
                    "Cliente",
                    "Materia",
                    "Responsable",
                    "Ultima actuacion",
                    "Estado",
                    "Prioridad",
                    "Accion",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-[0.64rem] font-semibold tracking-[0.16em] text-brand-slate-light uppercase"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const draftStatus = statusDrafts[item.id] ?? item.estadoInterno;
                  const isDirty = draftStatus !== item.estadoInterno;

                  return (
                    <tr
                      key={item.id}
                      className="border-t border-black/4 align-top transition-colors hover:bg-brand-green-bg/60"
                    >
                      <td className="px-4 py-4 font-mono text-sm text-brand-blue">
                        {item.numero}
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-brand-navy">
                          {item.titulo}
                        </p>
                        <p className="mt-1 text-xs leading-6 text-brand-slate">
                          {item.descripcion ?? "Sin descripcion registrada."}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-sm text-brand-navy">
                        {item.cliente}
                      </td>
                      <td className="px-4 py-4 text-sm text-brand-slate">
                        {item.materia}
                      </td>
                      <td className="px-4 py-4 text-sm text-brand-navy">
                        {item.abogado}
                      </td>
                      <td className="px-4 py-4 text-sm text-brand-slate">
                        {formatDateLabel(item.ultimaActuacion)}
                      </td>
                      <td className="px-4 py-4">
                        <CrmStatusBadge estado={item.estadoVista} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="inline-flex rounded-full bg-brand-surface px-3 py-1 text-xs font-semibold text-brand-slate">
                          {prioridadLabels[item.prioridad]}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {canCreate ? (
                          <div className="flex min-w-[12rem] flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedExpedienteId(item.id);
                                void loadDetail(item.id);
                              }}
                              className="crm-button-secondary inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-colors"
                            >
                              Abrir ficha
                            </button>
                            <select
                              value={draftStatus}
                              onChange={(event) =>
                                setStatusDrafts((current) => ({
                                  ...current,
                                  [item.id]: event.target
                                    .value as ExpedienteEstadoInterno,
                                }))
                              }
                              className="crm-select rounded-2xl px-3 py-2 text-sm outline-none transition-colors"
                            >
                              {catalogo?.opciones.estados.map((estado) => (
                                <option key={estado} value={estado}>
                                  {estadoInternoLabels[estado]}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              disabled={!isDirty || updatingId === item.id}
                              onClick={() => void handleStatusUpdate(item.id, draftStatus)}
                              className="crm-button-ghost inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {updatingId === item.id ? (
                                <>
                                  <LoaderCircle className="size-4 animate-spin" />
                                  Guardando
                                </>
                              ) : (
                                <>
                                  <Save className="size-4" />
                                  Aplicar
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="flex min-w-[12rem] flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedExpedienteId(item.id);
                                void loadDetail(item.id);
                              }}
                              className="crm-button-secondary rounded-full px-3 py-2 text-xs font-semibold transition-colors"
                            >
                              Abrir ficha
                            </button>
                            <span className="crm-soft text-xs">Solo lectura</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <CrmExpedienteDetailPanel
        key={resolvedDetail?.expediente.id ?? activeExpedienteId ?? "empty"}
        detail={resolvedDetail}
        catalogo={catalogo}
        loading={resolvedDetailLoading}
        error={resolvedDetailError}
        onReload={handleRefreshDetail}
        onSaveWorkspace={handleSaveWorkspace}
        onCreateNote={handleCreateNote}
        onUploadDocument={handleUploadDocument}
        onUpdateDocument={handleUpdateDocument}
      />
    </section>
  );
}
