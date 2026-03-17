"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type LucideIcon,
  BellRing,
  FileArchive,
  FolderKanban,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  SunMedium,
  Users,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { CrmAlertsPanel } from "@/components/crm/crm-alerts-panel";
import { CrmClientsPanel } from "@/components/crm/crm-clients-panel";
import { CrmDocumentsPanel } from "@/components/crm/crm-documents-panel";
import { CrmExpedientesPanel } from "@/components/crm/crm-expedientes-panel";
import { CrmHelpDock } from "@/components/crm/crm-help-dock";
import { CrmNotificationDock } from "@/components/crm/crm-notification-dock";
import { useCrmTheme } from "@/components/crm/crm-theme-frame";
import { CrmTeamPanel } from "@/components/crm/crm-team-panel";
import { CrmStatusBadge } from "@/components/crm/crm-status-badge";
import {
  crmPageMeta,
  crmPlaceholders,
  crmSections,
  type CrmViewId,
} from "@/data/crm-content";
import type { SessionUser } from "@/lib/auth";
import type { DashboardOverviewEnvelope } from "@/lib/crm-ops";
import type {
  ExpedienteCatalogo,
  ExpedienteCreatePayload,
  ExpedienteEstadoInterno,
  ExpedienteItemEnvelope,
  ExpedienteListItem,
  ExpedientesListEnvelope,
  ExpedienteCatalogoEnvelope,
  ExpedienteSummary,
} from "@/lib/crm-expedientes";

type FilterType = "todos" | "activos" | "urgentes";

type CrmDashboardProps = {
  usuario: SessionUser;
  isLoggingOut?: boolean;
  onLogout?: () => void;
};

const initialSummary: ExpedienteSummary = {
  total: 0,
  activos: 0,
  pendientes: 0,
  urgentes: 0,
  cerrados: 0,
};

const initialOverview: NonNullable<DashboardOverviewEnvelope["data"]> = {
  metrics: {
    expedientesActivos: 0,
    clientesActivos: 0,
    vencimientosPendientes: 0,
    documentosTotales: 0,
    leadsNuevos: 0,
    documentosPorRevisar: 0,
  },
  deadlines: [],
  activity: [],
  areas: [],
  teamLoad: [],
};

const SIDEBAR_COMPACT_STORAGE_KEY = "atria-crm-sidebar-compact";

const metricToneMap = {
  blue: {
    stripe: "before:bg-linear-to-r before:from-brand-blue before:to-[#4a90d9]",
    icon: "bg-brand-blue-bg text-brand-blue",
    text: "text-brand-blue",
  },
  green: {
    stripe: "before:bg-linear-to-r before:from-brand-green before:to-[#48bb78]",
    icon: "bg-brand-green-bg text-brand-green",
    text: "text-brand-green",
  },
  red: {
    stripe: "before:bg-linear-to-r before:from-brand-red before:to-[#e57373]",
    icon: "bg-brand-red-bg text-brand-red",
    text: "text-brand-red",
  },
  gold: {
    stripe: "before:bg-linear-to-r before:from-brand-gold-dim before:to-brand-gold",
    icon: "bg-brand-amber-bg text-brand-amber",
    text: "text-brand-amber",
  },
} as const;

const toneBackgroundMap = {
  blue: {
    chip: "bg-brand-blue-bg text-brand-blue",
    bar: "bg-brand-blue",
    dot: "bg-brand-blue",
  },
  green: {
    chip: "bg-brand-green-bg text-brand-green",
    bar: "bg-brand-green",
    dot: "bg-brand-green",
  },
  amber: {
    chip: "bg-brand-amber-bg text-brand-amber",
    bar: "bg-brand-amber",
    dot: "bg-brand-amber",
  },
  red: {
    chip: "bg-brand-red-bg text-brand-red",
    bar: "bg-brand-red",
    dot: "bg-brand-red",
  },
  gold: {
    chip: "bg-brand-amber-bg text-brand-amber",
    bar: "bg-linear-to-r from-brand-gold-dim to-brand-gold",
    dot: "bg-brand-gold",
  },
  slate: {
    chip: "bg-brand-surface text-brand-slate",
    bar: "bg-brand-slate",
    dot: "bg-brand-slate",
  },
} as const;

const viewPermissionMap: Partial<Record<CrmViewId, string>> = {
  expedientes: "expedientes.read",
  clientes: "clientes.read",
  documentos: "documentos.read",
  avisos: "avisos.read",
  equipo: "usuarios.read",
  configuracion: "usuarios.read",
};

function getInitials(nombreCompleto: string) {
  return nombreCompleto
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

function formatToday() {
  const formatter = new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formatted = formatter.format(new Date());

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

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

function PlaceholderScreen({
  activeView,
}: {
  activeView: "configuracion";
}) {
  const placeholder = crmPlaceholders[activeView];
  const Icono = placeholder.icono;

  return (
    <article className="crm-card rounded-[1.8rem] px-8 py-16 text-center">
      <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-[1.5rem] bg-brand-surface text-brand-green">
        <Icono className="size-8" />
      </div>
      <p className="mt-6 text-xs font-semibold tracking-[0.22em] text-brand-copper-dim uppercase">
        {placeholder.fase}
      </p>
      <h2 className="mt-4 font-display text-4xl text-brand-navy">
        {placeholder.titulo}
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-brand-slate">
        {placeholder.descripcion}
      </p>
    </article>
  );
}

function DashboardEmptyState({
  icono: Icono,
  titulo,
  descripcion,
}: {
  icono: LucideIcon;
  titulo: string;
  descripcion: string;
}) {
  return (
    <div className="px-5 py-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-surface text-brand-green">
        <Icono className="size-6" />
      </div>
      <p className="mt-4 text-sm font-semibold text-brand-navy">{titulo}</p>
      <p className="crm-muted mx-auto mt-2 max-w-sm text-xs leading-6">
        {descripcion}
      </p>
    </div>
  );
}

export function CrmDashboard({
  usuario,
  isLoggingOut = false,
  onLogout,
}: CrmDashboardProps) {
  const { theme, toggleTheme } = useCrmTheme();
  const [activeView, setActiveView] = useState<CrmViewId>("dashboard");
  const [sidebarCompact, setSidebarCompact] = useState(false);
  const [filter, setFilter] = useState<FilterType>("todos");
  const [expedientesState, setExpedientesState] = useState<{
    items: ExpedienteListItem[];
    summary: ExpedienteSummary;
    loading: boolean;
    error: string | null;
  }>({
    items: [],
    summary: initialSummary,
    loading: true,
    error: null,
  });
  const [catalogoState, setCatalogoState] = useState<{
    data: ExpedienteCatalogo | null;
    loading: boolean;
    error: string | null;
  }>({
    data: null,
    loading: true,
    error: null,
  });
  const [overviewState, setOverviewState] = useState<{
    data: typeof initialOverview;
    loading: boolean;
    error: string | null;
  }>({
    data: initialOverview,
    loading: true,
    error: null,
  });
  const [composerVersion, setComposerVersion] = useState(0);

  const loadExpedientes = useCallback(async () => {
    setExpedientesState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const response = await fetch("/api/expedientes?limit=40", {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json()) as ExpedientesListEnvelope;

      if (!response.ok || !payload.ok || !payload.data) {
        setExpedientesState((current) => ({
          ...current,
          loading: false,
          error:
            payload.mensaje ?? "No pudimos cargar los expedientes disponibles.",
        }));
        return;
      }

      setExpedientesState({
        items: payload.data.items,
        summary: payload.data.summary,
        loading: false,
        error: null,
      });
    } catch {
      setExpedientesState((current) => ({
        ...current,
        loading: false,
        error: "No pudimos cargar los expedientes disponibles.",
      }));
    }
  }, []);

  const loadCatalogo = useCallback(async () => {
    setCatalogoState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const response = await fetch("/api/expedientes/catalogo", {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json()) as ExpedienteCatalogoEnvelope;

      if (!response.ok || !payload.ok || !payload.data) {
        setCatalogoState({
          data: null,
          loading: false,
          error: payload.mensaje ?? "No pudimos cargar los catalogos base.",
        });
        return;
      }

      setCatalogoState({
        data: payload.data,
        loading: false,
        error: null,
      });
    } catch {
      setCatalogoState({
        data: null,
        loading: false,
        error: "No pudimos cargar los catalogos base.",
      });
    }
  }, []);

  const loadOverview = useCallback(async () => {
    setOverviewState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const response = await fetch("/api/dashboard/overview", {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json()) as DashboardOverviewEnvelope;

      if (!response.ok || !payload.ok || !payload.data) {
        setOverviewState({
          data: initialOverview,
          loading: false,
          error: payload.mensaje ?? "No pudimos cargar el panorama operativo.",
        });
        return;
      }

      setOverviewState({
        data: payload.data,
        loading: false,
        error: null,
      });
    } catch {
      setOverviewState({
        data: initialOverview,
        loading: false,
        error: "No pudimos cargar el panorama operativo.",
      });
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadExpedientes();
      void loadCatalogo();
      void loadOverview();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadCatalogo, loadExpedientes, loadOverview]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedState = window.localStorage.getItem(SIDEBAR_COMPACT_STORAGE_KEY);

      if (storedState === "true" || storedState === "false") {
        setSidebarCompact(storedState === "true");
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      SIDEBAR_COMPACT_STORAGE_KEY,
      String(sidebarCompact),
    );
  }, [sidebarCompact]);

  const handleRefreshExpedientes = useCallback(() => {
    void loadExpedientes();
    void loadCatalogo();
    void loadOverview();
  }, [loadCatalogo, loadExpedientes, loadOverview]);

  const handleCreateExpediente = useCallback(
    async (payload: ExpedienteCreatePayload) => {
      try {
        const response = await fetch("/api/expedientes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        const result = (await response.json()) as ExpedienteItemEnvelope;

        if (!response.ok || !result.ok) {
          return {
            ok: false,
            mensaje: result.mensaje ?? "No pudimos crear el expediente.",
          };
        }

        await Promise.all([loadExpedientes(), loadOverview()]);

        return {
          ok: true,
          mensaje: result.mensaje,
        };
      } catch {
        return {
          ok: false,
          mensaje: "No pudimos crear el expediente.",
        };
      }
    },
    [loadExpedientes, loadOverview],
  );

  const handleUpdateExpedienteStatus = useCallback(
    async (expedienteId: string, estado: ExpedienteEstadoInterno) => {
      try {
        const response = await fetch(`/api/expedientes/${expedienteId}/estado`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ estado }),
        });
        const result = (await response.json()) as ExpedienteItemEnvelope;

        if (!response.ok || !result.ok) {
          return {
            ok: false,
            mensaje:
              result.mensaje ?? "No pudimos actualizar el estado del expediente.",
          };
        }

        await Promise.all([loadExpedientes(), loadOverview()]);

        return {
          ok: true,
          mensaje: result.mensaje,
        };
      } catch {
        return {
          ok: false,
          mensaje: "No pudimos actualizar el estado del expediente.",
        };
      }
    },
    [loadExpedientes, loadOverview],
  );

  const filteredExpedientes = useMemo(() => {
    if (filter === "activos") {
      return expedientesState.items.filter((item) => item.estadoVista === "ACTIVO");
    }

    if (filter === "urgentes") {
      return expedientesState.items.filter((item) => item.estadoVista === "URGENTE");
    }

    return expedientesState.items;
  }, [expedientesState.items, filter]);

  const pageMeta = crmPageMeta[activeView];
  const pageSubtitle =
    activeView === "dashboard"
      ? `${formatToday()} - Bienvenido, ${usuario.nombreCompleto}`
      : pageMeta.subtitulo;
  const userInitials = getInitials(usuario.nombreCompleto);
  const userRoleLabel = usuario.rol.descripcion ?? usuario.rol.nombre;

  const sections = useMemo(
    () =>
      crmSections
        .map((section) => ({
          ...section,
          items: section.items
            .filter((item) => {
              const requiredPermission = viewPermissionMap[item.id];
              return requiredPermission
                ? usuario.permisos.includes(requiredPermission)
                : true;
            })
            .map((item) => {
              const badgeMap: Partial<Record<CrmViewId, number>> = {
                expedientes: expedientesState.summary.total,
                clientes: overviewState.data.metrics.clientesActivos,
                documentos: overviewState.data.metrics.documentosTotales,
                avisos: overviewState.data.metrics.vencimientosPendientes,
              };
              const badgeValue = badgeMap[item.id];

              return {
                ...item,
                badge:
                  badgeValue && badgeValue > 0 ? String(badgeValue) : undefined,
              };
            }),
        }))
        .filter((section) => section.items.length > 0),
    [
      expedientesState.summary.total,
      overviewState.data.metrics.clientesActivos,
      overviewState.data.metrics.documentosTotales,
      overviewState.data.metrics.vencimientosPendientes,
      usuario.permisos,
    ],
  );

  const dashboardMetrics = useMemo(
    () => [
      {
        etiqueta: "Expedientes activos",
        valor: String(overviewState.data.metrics.expedientesActivos),
        cambio: `${expedientesState.summary.total} expedientes visibles`,
        tono: "blue" as const,
        icono: FolderKanban,
      },
      {
        etiqueta: "Clientes activos",
        valor: String(overviewState.data.metrics.clientesActivos),
        cambio: "Cartera con seguimiento activo",
        tono: "green" as const,
        icono: Users,
      },
      {
        etiqueta: "Vencimientos proximos",
        valor: String(overviewState.data.metrics.vencimientosPendientes),
        cambio: "Alertas procesales pendientes",
        tono: "red" as const,
        icono: BellRing,
      },
      {
        etiqueta: "Documentos archivados",
        valor: String(overviewState.data.metrics.documentosTotales),
        cambio: `${overviewState.data.metrics.documentosPorRevisar} por revisar`,
        tono: "gold" as const,
        icono: FileArchive,
      },
    ],
    [
      expedientesState.summary.total,
      overviewState.data.metrics.clientesActivos,
      overviewState.data.metrics.documentosPorRevisar,
      overviewState.data.metrics.documentosTotales,
      overviewState.data.metrics.expedientesActivos,
      overviewState.data.metrics.vencimientosPendientes,
    ],
  );

  useEffect(() => {
    const allowedViews = new Set(
      sections.flatMap((section) => section.items.map((item) => item.id)),
    );

    if (!allowedViews.has(activeView)) {
      const timer = window.setTimeout(() => {
        setActiveView("dashboard");
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [activeView, sections]);

  return (
    <div className="crm-shell min-h-screen text-brand-ink">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside
          id="crm-tour-sidebar"
          className={`crm-sidebar hidden shrink-0 flex-col py-5 text-white transition-all duration-300 lg:flex ${
            sidebarCompact ? "w-[104px] px-3" : "w-[272px] px-4"
          }`}
        >
          <div
            className={`crm-sidebar-card rounded-[1.6rem] ${
              sidebarCompact ? "px-3 py-4" : "px-4 py-5"
            }`}
          >
            <div
              className={`flex items-center ${
                sidebarCompact ? "justify-center" : "justify-between gap-3"
              }`}
            >
              <BrandMark href={null} mode="light" subtitle="Area privada legal" />
              {!sidebarCompact ? (
                <button
                  type="button"
                  onClick={() => setSidebarCompact(true)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-white/72 transition-colors hover:bg-white/12 hover:text-white"
                  aria-label="Plegar panel lateral"
                  title="Plegar panel lateral"
                >
                  <PanelLeftClose className="size-4" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex-1 overflow-y-auto">
            <div id="crm-tour-sidebar-nav" className="space-y-6">
              {sections.map((section) => (
                <div key={section.titulo} className="space-y-2">
                  {!sidebarCompact ? (
                    <p className="px-3 text-[0.63rem] font-semibold tracking-[0.26em] text-white/32 uppercase">
                      {section.titulo}
                    </p>
                  ) : (
                    <div className="mx-auto h-px w-8 bg-white/10" />
                  )}
                  {section.items.map((item) => {
                    const Icono = item.icono;
                    const active = item.id === activeView;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveView(item.id)}
                        id={
                          item.id === "clientes"
                            ? "crm-tour-nav-clientes"
                            : item.id === "expedientes"
                              ? "crm-tour-nav-expedientes"
                              : undefined
                        }
                        title={item.label}
                        className={`crm-nav-item flex w-full items-center rounded-2xl py-3 text-left text-sm transition-colors ${
                          sidebarCompact
                            ? "justify-center px-3"
                            : "gap-3 px-4"
                        } ${
                          active
                            ? "crm-nav-item-active"
                            : ""
                        }`}
                      >
                        <Icono className="size-4" />
                        {!sidebarCompact ? <span>{item.label}</span> : null}
                        {!sidebarCompact && item.badge ? (
                          <span className="ml-auto rounded-full bg-brand-red px-2 py-0.5 text-[0.65rem] font-semibold text-white">
                            {item.badge}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="crm-sidebar-card mt-auto rounded-[1.4rem] p-4">
            <div
              className={`flex items-center ${
                sidebarCompact ? "justify-center" : "gap-3"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-brand-green to-brand-copper text-sm font-semibold text-white">
                {userInitials}
              </div>
              {!sidebarCompact ? (
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {usuario.nombreCompleto}
                  </p>
                  <p className="truncate text-xs text-white/48">{userRoleLabel}</p>
                </div>
              ) : null}
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="crm-topbar px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3 lg:hidden">
                  <BrandMark href={null} subtitle="Area privada legal" />
                </div>
                <div className="hidden lg:flex">
                  <button
                    type="button"
                    onClick={() => setSidebarCompact((current) => !current)}
                    className="crm-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
                    aria-label={
                      sidebarCompact
                        ? "Expandir panel lateral"
                        : "Plegar panel lateral"
                    }
                    title={
                      sidebarCompact
                        ? "Expandir panel lateral"
                        : "Plegar panel lateral"
                    }
                  >
                    {sidebarCompact ? (
                      <PanelLeftOpen className="size-4" />
                    ) : (
                      <PanelLeftClose className="size-4" />
                    )}
                    {sidebarCompact ? "Expandir menu" : "Plegar menu"}
                  </button>
                </div>
                <h1 className="font-display text-3xl text-brand-navy">
                  {pageMeta.titulo}
                </h1>
                <p className="text-sm text-brand-slate">{pageSubtitle}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveView("avisos")}
                  id="crm-tour-alerts-button"
                  className="crm-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm"
                >
                  <BellRing className="size-4" />
                  Avisos
                </button>

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="crm-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
                >
                  {theme === "dark" ? (
                    <SunMedium className="size-4" />
                  ) : (
                    <Moon className="size-4" />
                  )}
                  {theme === "dark" ? "Modo claro" : "Modo oscuro"}
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  disabled={!onLogout || isLoggingOut}
                  className="crm-button-ghost inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <LogOut className="size-4" />
                  {isLoggingOut ? "Cerrando..." : "Cerrar sesion"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView("expedientes");
                    setComposerVersion((current) => current + 1);
                  }}
                  id="crm-tour-new-expediente"
                  className="crm-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                >
                  <Plus className="size-4" />
                  Nuevo expediente
                </button>
              </div>
            </div>
          </header>

          <div className="overflow-x-auto border-b border-black/5 bg-white px-4 py-3 lg:hidden">
            <div className="flex gap-2">
              {sections.flatMap((section) => section.items).map((item) => {
                const active = item.id === activeView;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveView(item.id)}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${
                      active
                        ? "bg-brand-navy text-white"
                        : "bg-brand-surface text-brand-slate"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
            {activeView === "dashboard" ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {dashboardMetrics.map((metric) => {
                    const Icono = metric.icono;
                    const tone = metricToneMap[metric.tono];

                    return (
                      <article
                        key={metric.etiqueta}
                        className={`crm-card animate-rise relative overflow-hidden rounded-[1.55rem] p-5 before:absolute before:inset-x-0 before:top-0 before:h-1 ${tone.stripe}`}
                      >
                        <div className={`inline-flex rounded-2xl p-3 ${tone.icon}`}>
                          <Icono className="size-5" />
                        </div>
                        <p className="mt-5 text-[0.68rem] font-semibold tracking-[0.18em] text-brand-slate-light uppercase">
                          {metric.etiqueta}
                        </p>
                        <p className="mt-3 font-display text-5xl text-brand-navy">
                          {metric.valor}
                        </p>
                        <p className={`mt-4 text-sm font-medium ${tone.text}`}>
                          {metric.cambio}
                        </p>
                      </article>
                    );
                  })}
                </div>

                <article
                  id="crm-tour-dashboard-overview"
                  className="crm-kpi-strip rounded-[1.8rem] px-5 py-4"
                >
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-white/60 uppercase">
                        Leads nuevos
                      </p>
                      <p className="mt-2 font-display text-4xl text-white">
                        {overviewState.data.metrics.leadsNuevos}
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-white/60 uppercase">
                        Documentos por revisar
                      </p>
                      <p className="mt-2 font-display text-4xl text-white">
                        {overviewState.data.metrics.documentosPorRevisar}
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-white/60 uppercase">
                        Panorama operativo
                      </p>
                      <p className="mt-2 text-sm leading-7 text-white/78">
                        {overviewState.error
                          ? overviewState.error
                          : "Tablero conectado a expedientes, clientes, leads, documentos y avisos reales."}
                      </p>
                    </div>
                  </div>
                </article>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_20rem]">
                  <article className="crm-card overflow-hidden rounded-[1.7rem]">
                    <div className="flex flex-col gap-4 border-b border-black/5 px-5 py-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-brand-navy">
                          Expedientes recientes
                        </p>
                        <p className="text-sm text-brand-slate">
                          Casos visibles para tu perfil operativo
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {[
                          ["todos", "Todos"],
                          ["activos", "Activos"],
                          ["urgentes", "Urgentes"],
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
                    </div>

                    {expedientesState.loading ? (
                      <div className="flex items-center justify-center px-6 py-16 text-brand-slate">
                        <Search className="mr-3 size-4" />
                        Cargando expedientes recientes...
                      </div>
                    ) : filteredExpedientes.length === 0 ? (
                      <div className="px-6 py-16 text-center">
                        <p className="font-display text-3xl text-brand-navy">
                          No hay expedientes para esta vista
                        </p>
                        <p className="mt-3 text-sm text-brand-slate">
                          Cambia el filtro o crea un nuevo expediente desde la intranet.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse">
                          <thead>
                            <tr className="bg-brand-offwhite">
                              {[
                                "N Expediente",
                                "Cliente",
                                "Materia",
                                "Abogado",
                                "Ultima actuacion",
                                "Estado",
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
                            {filteredExpedientes.map((row) => (
                              <tr
                                key={row.id}
                                className="border-t border-black/4 transition-colors hover:bg-brand-green-bg/70"
                              >
                                <td className="px-4 py-4 font-mono text-sm text-brand-blue">
                                  {row.numero}
                                </td>
                                <td className="px-4 py-4 text-sm font-medium text-brand-navy">
                                  {row.cliente}
                                </td>
                                <td className="px-4 py-4 text-sm text-brand-slate">
                                  {row.materia}
                                </td>
                                <td className="px-4 py-4 text-sm text-brand-navy">
                                  {row.abogado}
                                </td>
                                <td className="px-4 py-4 text-sm text-brand-slate">
                                  {formatDateLabel(row.ultimaActuacion)}
                                </td>
                                <td className="px-4 py-4">
                                  <CrmStatusBadge estado={row.estadoVista} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </article>

                  <article className="crm-card overflow-hidden rounded-[1.7rem]">
                    <div className="border-b border-black/5 px-5 py-4">
                      <p className="text-lg font-semibold text-brand-navy">
                        Vencimientos procesales
                      </p>
                      <p className="text-sm text-brand-slate">
                        Proximas fechas criticas
                      </p>
                    </div>
                    <div>
                      {overviewState.loading ? (
                        <DashboardEmptyState
                          icono={BellRing}
                          titulo="Cargando vencimientos"
                          descripcion="Estamos consolidando tus alertas procesales visibles."
                        />
                      ) : overviewState.data.deadlines.length === 0 ? (
                        <DashboardEmptyState
                          icono={BellRing}
                          titulo="Sin vencimientos por ahora"
                          descripcion="Cuando registres expedientes y avisos, aqui apareceran las proximas fechas criticas."
                        />
                      ) : (
                        overviewState.data.deadlines.map((deadline) => {
                          const tone =
                            deadline.diasRestantes <= 3
                              ? toneBackgroundMap.red
                              : deadline.diasRestantes <= 10
                                ? toneBackgroundMap.amber
                                : toneBackgroundMap.green;

                          return (
                            <div
                              key={deadline.id}
                              className="flex items-center gap-4 border-t border-black/4 px-5 py-4 first:border-t-0"
                            >
                              <div
                                className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl text-sm font-semibold ${tone.chip}`}
                              >
                                {deadline.diasRestantes}
                                <span className="text-[0.6rem] font-medium uppercase">
                                  dias
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-brand-navy">
                                  {deadline.titulo}
                                </p>
                                <p className="mt-1 truncate font-mono text-[0.72rem] text-brand-slate-light">
                                  {deadline.expedienteNumero} - {deadline.cliente}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </article>
                </div>

                <div className="grid gap-5 xl:grid-cols-3">
                  <article className="crm-card overflow-hidden rounded-[1.7rem]">
                    <div className="border-b border-black/5 px-5 py-4">
                      <p className="text-lg font-semibold text-brand-navy">
                        Actividad reciente
                      </p>
                    </div>
                    <div>
                      {overviewState.loading ? (
                        <DashboardEmptyState
                          icono={Search}
                          titulo="Cargando actividad"
                          descripcion="En breve veras aqui el historial mas reciente del espacio de trabajo."
                        />
                      ) : overviewState.data.activity.length === 0 ? (
                        <DashboardEmptyState
                          icono={Search}
                          titulo="Sin actividad registrada"
                          descripcion="La trazabilidad aparecera cuando se creen clientes, expedientes, leads o documentos."
                        />
                      ) : (
                        overviewState.data.activity.map((activity) => (
                          <div
                            key={activity.id}
                            className="flex gap-3 border-t border-black/4 px-5 py-4 first:border-t-0"
                          >
                            <div className="mt-1 size-2 shrink-0 rounded-full bg-brand-green" />
                            <div>
                              <p className="text-sm leading-7 text-brand-navy">
                                {activity.usuario
                                  ? `${activity.usuario} ${activity.descripcion}`
                                  : activity.descripcion}
                              </p>
                              <p className="text-xs text-brand-slate-light">
                                {formatDateLabel(activity.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </article>

                  <article className="crm-card overflow-hidden rounded-[1.7rem]">
                    <div className="border-b border-black/5 px-5 py-4">
                      <p className="text-lg font-semibold text-brand-navy">
                        Areas de practica
                      </p>
                      <p className="text-sm text-brand-slate">
                        Distribucion de carga
                      </p>
                    </div>
                    <div className="space-y-4 px-5 py-5">
                      {overviewState.loading ? (
                        <DashboardEmptyState
                          icono={FolderKanban}
                          titulo="Cargando distribucion"
                          descripcion="Estamos calculando la carga visible por area de practica."
                        />
                      ) : overviewState.data.areas.length === 0 ? (
                        <DashboardEmptyState
                          icono={FolderKanban}
                          titulo="Aun no hay carga por areas"
                          descripcion="Cuando abras expedientes, aqui veras como se distribuye el trabajo por materia."
                        />
                      ) : (
                        overviewState.data.areas.map((area) => (
                          <div key={area.nombre}>
                            <div className="mb-2 flex items-center justify-between gap-4">
                              <p className="text-sm font-medium text-brand-navy">
                                {area.nombre}
                              </p>
                              <p className="text-sm font-semibold text-brand-slate">
                                {area.porcentaje}%
                              </p>
                            </div>
                            <div className="h-2 rounded-full bg-brand-surface">
                              <div
                                className="h-2 rounded-full bg-brand-green"
                                style={{ width: `${area.porcentaje}%` }}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </article>

                  <article className="crm-card overflow-hidden rounded-[1.7rem]">
                    <div className="border-b border-black/5 px-5 py-4">
                      <p className="text-lg font-semibold text-brand-navy">
                        Carga por abogado
                      </p>
                      <p className="text-sm text-brand-slate">
                        Expedientes asignados / capacidad
                      </p>
                    </div>
                    <div className="space-y-4 px-5 py-5">
                      {overviewState.loading ? (
                        <DashboardEmptyState
                          icono={Users}
                          titulo="Cargando equipo"
                          descripcion="Estamos calculando la carga actual del equipo juridico."
                        />
                      ) : overviewState.data.teamLoad.length === 0 ? (
                        <DashboardEmptyState
                          icono={Users}
                          titulo="Sin carga asignada"
                          descripcion="Cuando existan expedientes activos, aqui veras la distribucion por responsable."
                        />
                      ) : (
                        overviewState.data.teamLoad.map((lawyer) => {
                          const tone =
                            lawyer.rol === "SOCIO"
                              ? toneBackgroundMap.blue
                              : lawyer.rol === "ABOGADO"
                                ? toneBackgroundMap.green
                                : toneBackgroundMap.amber;

                          return (
                            <div key={lawyer.id} className="space-y-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold ${tone.chip}`}
                                >
                                  {getInitials(lawyer.nombreCompleto)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-brand-navy">
                                    {lawyer.nombreCompleto}
                                  </p>
                                </div>
                                <p className="font-mono text-xs text-brand-slate-light">
                                  {lawyer.expedientesActivos}/{lawyer.capacidadSugerida}
                                </p>
                              </div>
                              <div className="h-2 rounded-full bg-brand-surface">
                                <div
                                  className={`h-2 rounded-full ${tone.bar}`}
                                  style={{ width: `${lawyer.porcentaje}%` }}
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </article>
                </div>
              </div>
            ) : activeView === "expedientes" ? (
              <CrmExpedientesPanel
                usuario={usuario}
                items={expedientesState.items}
                summary={expedientesState.summary}
                catalogo={catalogoState.data}
                loading={expedientesState.loading || catalogoState.loading}
                error={expedientesState.error ?? catalogoState.error}
                composerVersion={composerVersion}
                onRefresh={handleRefreshExpedientes}
                onCreate={handleCreateExpediente}
                onUpdateEstado={handleUpdateExpedienteStatus}
              />
            ) : activeView === "clientes" ? (
              <CrmClientsPanel usuario={usuario} catalogo={catalogoState.data} />
            ) : activeView === "documentos" ? (
              <CrmDocumentsPanel />
            ) : activeView === "avisos" ? (
              <CrmAlertsPanel usuario={usuario} />
            ) : activeView === "equipo" ? (
              <CrmTeamPanel />
                ) : (
                  <PlaceholderScreen
                    activeView="configuracion"
                  />
                )}
          </main>
        </div>
      </div>
      <CrmHelpDock
        usuario={usuario}
        activeView={activeView}
        onNavigate={setActiveView}
      />
      <CrmNotificationDock deadlines={overviewState.data.deadlines} />
    </div>
  );
}
